/**
 * Query a git local repo commits.
 *
 * @typedef {hash: string, author: User, committer: User, message: string} Commit
 * @typedef {function(commit: Commit): Promise<Commit,Error>} Mapper
 * @typedef {name: string, email: string} User
 */

'use strict';

const clone = require('lodash.clonedeepwith');
const yaml = require('js-yaml');

const git = require('./git');

const FORMAT = `
hash: "%H"
ts: %ct
author:
  name: ${block('%an', 4)}
  email: ${block('%ae', 4)}
committer:
  name: ${block('%cn', 4)}
  email: ${block('%ce', 4)}
message: ${block('%B', 2)}
---`;
const CMD = ['log', '--no-merges', '--topo-order', '--date=unix', `--format=${FORMAT}`];
const SEP = '\n---\n';

/**
 * Resolve to an array of commit for the repo in the current working directory
 * or the repo at gitDir.
 *
 * @param  {string}          [options.rev]    Revision range
 * @param  {Mapper|Mapper[]} [options.mapper] Transform commits
 * @param  {string}          [options.gitDir] Path to the local repo to query
 * @return {Promise<Commit[], Error>}
 */
exports.get = function ({rev = 'HEAD', mapper = [], gitDir} = {}) {
  const client = git({gitDir});
  const args = [].concat(CMD, rev);

  return client(args, {sep: SEP, mapper: [init].concat(mapper)});
};

/**
 * Wrap string with git log wrap placeholder.
 *
 * It indent the string in the git log output.
 *
 * @param  {string} str    string to indent
 * @param  {number} indent Indent length
 * @return {string}
 */
function block(str, indent = 0) {
  return `|\n%w(0,${indent},${indent})${str}%w(0,0,0)`;
}

/**
 * Decode yaml commit.
 *
 * @param  {string} raw A yaml encode commit.
 * @return {Commit}
 */
function init(raw) {
  const commit = yaml.safeLoad(raw);

  if (!commit) {
    return;
  }

  commit.date = new Date(commit.ts * 1000);

  return trimFields(commit);
}

/**
 * Clone a commit object by trimming each string value.
 *
 * @param  {Commit} commit Commit to filter string values.
 * @return {Commit}
 */
function trimFields(commit) {
  return clone(commit, value => value && value.trim && value.trim());
}
