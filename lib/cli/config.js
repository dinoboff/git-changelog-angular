'use strict';

const yargs = require('yargs');
const taggedVersions = require('tagged-versions');

const git = require('../git');

module.exports = function (argv = process.argv.slice(2)) {
  yargs
    .usage('Usage: $0 [--git-dir=path] [--any] [-h] [revision..]')
    .example(
      '$0',
      'Create change log between HEAD and previous stable tag from HEAD.'
    )
    .example(
      '$0 --any',
      'Create change log between HEAD and the previous tag from HEAD, stable or prerelease.'
    )
    .example(
      '$0 master',
      'Create change log between master and previous stable tag from HEAD.'
    )
    .example(
      '$0 v1.1.0',
      'Create change log between v1.1.0 and the previous.'
    )
    .example(
      '$0 v1.0.0..v1.1.0',
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
        description: 'Infer version usning the latest tag including prerelease tags',
        alias: 'a',
        type: 'boolean'
      }

    });

  const {gitDir, any: anyTag, _: revList} = yargs.parse(argv);
  const client = git({gitDir});

  return getRange(revList, {gitDir, client, anyTag}).then(rev => ({
    client,
    gitDir,
    rev,
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
 * @return {Promise<string[],Error>}
 */
function getRange(revList, {gitDir, client, anyTag}) {
  if (revList.length > 1) {
    return Promise.resolve(revList);
  }

  if (revList.length === 1 && revList[0].includes('..')) {
    return Promise.resolve(revList);
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
  const revisionHash = client(['rev-parse', rev], {capture: true}).then(line => line.trim());
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

      return [rev, `^${commit.tag}`];
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
