'use strict';

const yargs = require('yargs');
const taggedVersions = require('tagged-versions');

const git = require('../git');

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
  const client = git({gitDir});
  const anyTag = any || identifier != null;

  return getRange(revList, {gitDir, client, anyTag}).then(({rev, previous}) => ({
    client,
    gitDir,
    rev,
    previous,
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
 * @param  {GitClient} options.client   Git Client
 * @param  {boolean}   options.anyTag   Include prerelease in the search for previous release.
 * @return {Promise<{rev: string[], previous},Error>}
 */
function getRange(revList, {gitDir, client, anyTag}) {
  if (
    revList.length > 1 || (
      revList.length === 1 &&
      revList[0].includes('..')
    )
  ) {
    return Promise.resolve({rev: revList});
  }

  const rev = revList.pop() || 'HEAD';

  return lastTagRange({rev, gitDir, client, anyTag});
}

/**
 * Return the revision range targeting commits between revision and its previous
 * version tag (if there's one).
 *
 * @param  {string}    options.rev      Revision
 * @param  {string}    options.gitDir   Path to git repository
 * @param  {GitClient} options.client   Git Client
 * @param  {boolean}   options.anyTag   Include prerelease in the search for previous release.
 * @return {Promise<string[],Error>}
 */
function lastTagRange({rev, gitDir, client, anyTag}) {
  const revisionHash = revParse({rev, client});
  const tags = versionTags({rev, gitDir, anyTag});

  return Promise.all([revisionHash, tags])
    .then(([hash, [last, prev]]) => {
      if (last != null && last.hash !== hash) {
        return last;
      }

      return prev;
    })
    .then(commit => {
      if (commit == null) {
        return [rev];
      }

      return {
        rev: [rev, `^${commit.tag}`],
        previous: commit.version
      };
    });
}

/**
 * Return a list of tagged parent to the revision.
 *
 * if `anyTag` is true, it will exclude any prerelease tag.
 *
 * @param  {string}    options.rev      Revision
 * @param  {string}    options.gitDir   Path to git repository
 * @param  {GitClient} options.client   Git Client
 * @param  {boolean}   options.anyTag   Include prerelease in the search for previous release.
 * @return {Promise<{tag: string, hash: string},Error>}
 */
function versionTags({rev, gitDir, anyTag}) {
  const range = anyTag ? undefined : 'x.x.x';

  return taggedVersions.getList({range, gitDir, rev});
}

/**
 * Return a revision hash.
 *
 * If the revision is a tag, it will return the commit the tag is referencing
 * (annotation tag) or the commit of the tag itself (basic tag).
 *
 * @param  {string}    options.rev    revision
 * @param  {GitClient} options.client Git client
 * @return {Promise<string,Error>}
 */
function revParse({rev, client}) {
  const cmd = ['rev-parse', `${rev}^{commit}`];

  return client(cmd, {capture: true}).then(line => line.trim());
}
