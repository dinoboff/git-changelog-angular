'use strict';

const gitPromise = require('git-spawned-promise');
const taggedVersions = require('tagged-versions');
const yargs = require('yargs');

module.exports = function (argv = process.argv.slice(2)) {
  yargs
    .usage('Usage: $0 [--git-dir=path] [--[no-]header] [--any] [-h] [revision..]')
    .example(
      '$0',
      'Create change log between HEAD and previous stable tag from HEAD; ' +
      'show the inferred version of the release as a header.'
    )
    .example(
      '$0 --any',
      'Create change log between HEAD and the previous tag from HEAD, stable or prerelease.; ' +
      'show the inferred version of the release as a header.'
    )
    .example(
      '$0 -i beta master',
      'Create change log between master and previous stable tag from HEAD; ' +
      'show the - prerelease - inferred version of the release as a header.'
    )
    .example(
      '$0 v1.1.0',
      'Create change log between v1.1.0 and the previous; ' +
      'show the release version, "v1.1.0" as a header.'
    )
    .example(
      '$0 --no-header v1.0.0..v1.1.0',
      'Create change log between v1.1.0 and v1.0.0.'
    )
    .help('help')
    .options({

      help: {
        alias: 'h',
        type: 'boolean'
      },

      'git-dir': {
        description: 'Path to the git repository',
        default: process.env.GIT_DIR,
        normalize: true
      },

      any: {
        description: 'Infer version using the latest tag including prerelease tags',
        alias: 'a',
        type: 'boolean'
      },

      identifier: {
        description: 'Prerelease identifier to infer the new version with',
        alias: 'i',
        type: 'string'
      },

      header: {
        description: 'Add a header with the version or revision range at the top',
        type: 'boolean',
        default: true
      }

    });
  const {gitDir, any, identifier, header: printHeader, _: revList} = yargs.parse(argv);
  const client = gitPromise({gitDir});
  const anyTag = any || identifier != null;

  return getRange(revList, {gitDir, anyTag}).then(({rev, previous = null, next = null}) => ({
    client,
    gitDir,
    rev,
    previous,
    next,
    identifier,
    printHeader,
    showHelp: yargs.showHelp
  }));
};

/**
 * Limit the revision range to the commit since the previous (pre)release.
 *
 * The range should include only commit from the last version to the provided
 * revision.
 *
 * @param  {string}  revList Revision To convert
 * @param  {string}    options.gitDir   Path to git repository
 * @param  {boolean}   options.anyTag   Include prerelease in the search for previous release.
 * @return {Promise<{rev: string[], previous},Error>}
 */
function getRange(revList, {gitDir, anyTag}) {
  if (isRange(revList)) {
    return Promise.resolve({rev: revList});
  }

  const rev = revList.pop() || 'HEAD';

  return lastTagRange({rev, gitDir, anyTag});
}

function isRange(revList = []) {
  if (revList.length !== 1) {
    return revList.length > 0;
  }

  const rev = revList[0];

  return (
    rev.includes('..') ||
    rev.includes('^@') ||
    rev.includes('^!') ||
    rev.includes('^-')
  );
}

/**
 * Return the revision range targeting commits between revision and its previous
 * version tag (if there's one).
 *
 * @param  {object}    options          Options
 * @param  {string}    options.rev      Revision
 * @param  {string}    options.gitDir   Path to git repository
 * @param  {boolean}   options.anyTag   Include prerelease in the search for previous release.
 * @return {Promise<{rev: string[], next: string, previous: string},Error>}
 */
function lastTagRange(options) {
  const {rev: revision} = options;

  return Promise.all([
    currentVersion(options),
    previousVersion(options)
  ]).then(([current, last]) => {
    const next = current == null ? null : current.version;

    if (last == null) {
      return {next, rev: [revision]};
    }

    const {tag, version: previous} = last;

    return {next, previous, rev: [revision, `^${tag}`]};
  });
}

/**
 * Get tagged version matching the revision.
 *
 * If the revision has multiple tag, it should resolve to the greater semver
 * one. Resolve to null if there are none.
 *
 * @param  {string} options.rev    Revision to match to a tagged version.
 * @param  {string} options.gitDir Path to git repository
 * @return {Promise<{tag: string, version: string},Error>}
 */
function currentVersion({rev: revision, gitDir}) {
  const rev = `${revision}^!`;

  return taggedVersions.getLastVersion({gitDir, rev});
}

/**
 * Get the version tagged preceding the commit.
 *
 * @param  {string}  options.rev    Revision to look a tagged version from.
 * @param  {string}  options.gitDir Path to git repository
 * @param  {boolean} options.anyTag Include prerelease tagged in the search.
 * @return {Promise<{tag: string, version: string},Error>}
 */
function previousVersion({rev: revision, gitDir, anyTag}) {
  const range = anyTag ? undefined : 'x.x.x';
  const rev = `${revision}^@`;

  return taggedVersions.getLastVersion({range, gitDir, rev});
}
