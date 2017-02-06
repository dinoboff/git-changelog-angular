/**
 * Parse commit message and render change logs.
 *
 * @typedef {{repo: {owner: string, project: string}, issue: number}}
 * @typedef {{
 *          type: string,
 *          scope: string,
 *          body: string,
 *          breakingChanges: string|string[],
 *          revert: string,
 *          issues: Issue[]
 *        }} ParsedCommit
 * @typedef {{type: string, name: string, description: string}} TypeDefinition
 * @typedef {{type: string, name: string, description: string, commits: ParsedCommit[]}} Changes
 */

'use strict';

const debug = require('debug')('git-changelog:angular');

const pkg = require('../package.json');
const commits = require('./commits');
const template = require('./template');

// eslint-disable-next-line node/no-missing-require
const parser = pkg.dist ? require('./parser') : require('./parser.live.js');

const DEFAULT_TYPES = [{
  type: 'feat',
  name: 'Feature',
  description: 'new functionality'
}, {
  type: 'fix',
  name: 'Bug Fix',
  description: 'bug fix'
}];

module.exports = exports = {
  parser,

  version: pkg.version,

  /**
   * Generate changelog for a revision range.
   *
   * @param  {object}           [options]        Query options
   * @param  {string}           [options.rev]    Revision branch (default to HEAD)
   * @param  {GitClient}        [options.client] Git client
   * @param  {TypeDefinition[]} [options.types]  Commit types to render
   * @return {Promise<{commits: ParsedCommit[], range: string, changes: Changes},Error>}
   */
  create(options = {}) {
    return exports.context(options)
      .then(context => template.render(context, options));
  },

  /**
   * Resolve to a context for a changelog template.
   *
   * @param  {object}           [options]        Query options
   * @param  {string}           [options.rev]    Revision branch (default to HEAD)
   * @param  {GitClient}        [options.client] GitClient
   * @param  {TypeDefinition[]} [options.types]  Commit types to render
   * @return {Promise<{commits: ParsedCommit[], range: string, changes: Changes},Error>}
   */
  context(options = {}) {
    const {rev} = options;

    return exports.commits(options)
      .then(commits => ({
        commits,
        rev,
        changes: exports.changes(commits, options),
        breakingChanges: exports.breakingChanges(commits, options)
      }));
  },

  /**
   * Query all commits for a revision branch and parse their commit message.
   *
   * @param  {object}    [options]        Query options
   * @param  {string}    [options.rev]    Revision branch (default to HEAD)
   * @param  {GitClient} [options.client] GitClient
   * @return {Promise<ParsedCommit[], Error>}
   */
  commits(options) {
    return commits.get(Object.assign(
        {},
        options,
        {mapper: exports.mapper}
      ))
      .then(list => exports.filter(list));
  },

  /**
   * Extend a commit object by parsing its message.
   *
   * Return undefined if it cannot parse no valid type.
   *
   * @param  {Commit} commit Commit to extend
   * @return {ParsedCommit|void}
   */
  mapper(commit) {
    if (commit == null || commit.message == null) {
      return;
    }

    const msg = exports.parser.parse(commit.message);

    if (msg.type == null) {
      debug(`Ignoring commit ${commit.hash}: ${commit.message}`);

      return;
    }

    return Object.assign(msg, commit);
  },

  /**
   * Sort commits by types.
   *
   * @param  {ParsedCommit}     commits         Commits to sort
   * @param  {TypeDefinition[]} [options.types] List of type to accept
   * @return {Changes[]}
   */
  changes(commits, {types = DEFAULT_TYPES} = {}) {
    if (commits == null || commits.length < 1) {
      return [];
    }

    return types
      .map(definition => Object.assign(
        {},
        definition,
        {
          commits: commits
            .filter(({type}) => type === definition.type)
            .sort(exports.compare)
        }
      ))
      .filter(type => type.commits.length > 0);
  },

  /**
   * Returns commits with breaking changes.
   *
   * @param  {ParsedCommit[]} commits Commits to filter
   * @return {ParsedCommit[]}
   */
  breakingChanges(commits) {
    return commits.filter(commit => commit.breakingChanges != null);
  },

  /**
   * Filter out reverted commits.
   *
   * @param  {ParsedCommit[]} commits Commits to filter out.
   * @return {ParsedCommit[]}
   */
  filter(commits = []) {
    const reverted = new Set(
      commits
        .filter(({revert: hash}) => hash != null && hash.length >= 7)
        .map(commit => commit.revert.slice(0, 7))
    );

    if (reverted.size < 1) {
      return commits;
    }

    return commits
      .filter(({type}) => type !== 'revert')
      .filter(({hash}) => reverted.has(hash.slice(0, 7)) === false);
  },

  /**
   * Compare commits scopes.
   *
   * @param  {ParsedCommit} a Commit a
   * @param  {ParsedCommit} b Commit b
   * @return {number}
   */
  compare(a, b) {
    const aScope = a.scope || '';
    const bScope = b.scope || '';

    return aScope.localeCompare(bScope);
  }

};
