/**
 * Git client.
 *
 * @typedef {function(cmd: string[], opts: {capture: boolean, mapper: Mapper[], sep, string}): Promise<any,Error>} GitClient
 * @typedef {function(item: object): Promise<any,Error>} Mapper
 */

'use strict';

const ps = require('child_process');

const BufferList = require('bl');
const split = require('split');
const through = require('through2');

/**
 * Create a git client bound to a local repository.
 *
 * @param  {string} options.gitDir Path to the git repository (let git find the repository by default)
 * @return {GitClient}
 */
module.exports = function ({gitDir} = {}) {

  /**
   * Run a command and settle once the process exit.
   *
   * Resolve if it exit with 0; reject with an error including stderr otherwise.
   *
   * @param  {string[]}         cmd             Git subcommand to run
   * @param  {boolean}          options.capture Resolve with stdout content when set to true.
   * @param  {Mapper|Mapper[]}  options.mapper  Transform items
   * @param  {string|RegExp}    options.sep     Token used to split the stdout (to map each part)
   * @return {Promise<any,Error>}
   */
  return (cmd, {capture = false, sep, mapper} = {}) => {
    const doMap = sep != null || (mapper != null && mapper.length > 0);
    const stdio = [
      'ignore',
      capture || doMap ? 'pipe' : 'ignore',
      'pipe'
    ];

    const args = gitDir == null ? cmd : ['--git-dir', gitDir].concat(cmd);
    const proc = ps.spawn('git', args, {stdio});

    if (doMap) {
      return transformStdout(proc, {sep, mapper});
    }

    if (capture) {
      return captureStdout(proc);
    }

    return waitFor(proc);
  };
};

/**
 * Capture stdout and resolve to settle once the proc exit.
 *
 * It will resolve to the stdout content if the exit code is 0; to stderr
 * otherwise.
 *
 * @param  {ChildProcess} proc Child process with stdout and stderr set to pipe.
 * @return {Promise<String,Error>}
 */
function captureStdout(proc) {
  const stdout = new BufferList();

  proc.stdout.pipe(stdout);

  return waitFor(proc)
    .then(() => stdout.toString());
}

/**
 * Capture stdout split it and map each item, and settle once the proc exit.
 *
 * It will resolve to the array of item if the exit code is 0; to stderr
 * otherwise.
 *
 * @param  {ChildProcess}    proc           Child process with stdout and stderr set to pipe.
 * @param  {Mapper|Mapper[]} options.mapper Transform items
 * @param  {string|RegExp}   options.sep    Token used to split the stdout (to map each part)
 * @return {Promise<object[],Error>}
 */
function transformStdout(proc, {sep = '\n', mapper = []}) {
  const result = new Promise((resolve, reject) => {
    let stream = proc.stdout.pipe(split(sep));

    for (const fn of [].concat(mapper)) {
      stream = stream.pipe(transformer(fn).on('error', reject));
    }

    const result = [];

    stream.on('data', item => result.push(item));
    stream.on('error', reject);
    stream.on('end', () => resolve(result));
  });

  return Promise.all([result, waitFor(proc)])
    .then(([result]) => result);
}

/**
 * Create a map Transform stream.
 *
 * If the the mapper function return null, it will skip that item (it will
 * not close the stream).
 *
 * If the mapper reject, the stream will emit an error.
 *
 * @param  {function(object): object|Promise<object,Error>} mapper Mapper function.
 * @return {Transform}
 */
function transformer(mapper) {
  return through.obj(
    (item, enc, callback) => {
      tryFn(mapper, item)
        .then(val => callback(null, val === null ? undefined : val))
        .catch(callback);
    }
  );
}

/**
 * Wrap the function in a promise.
 *
 * Ensure the function returns a promise and capture any thrown error.
 *
 * @param  {function}  fn   Function to wrap
 * @param  {...[type]} args Arguments to call the function with
 * @return {Promise<any,Error>}
 */
function tryFn(fn, ...args) {
  return new Promise(resolve => resolve(fn(...args)));
}

/**
 * Report git child process error.
 */
class GitError extends Error {

  /**
   * Error displaying the child process argument, the exit code and a message.
   *
   * @param  {ChildProcess} proc ChildProcess to report about.
   * @param  {number}       code Its exit code
   * @param  {string}       msg  An error message.
   */
  constructor(proc, code, msg) {
    const err = `"${proc.spawnargs.join(' ')}" exited with ${code}:\n\n${msg}\n`;

    super(err);

    this.args = proc.spawnargs;
  }

}

/**
 * Settle once the process exits.
 *
 * Resolve if the process exit code is zero.
 *
 * Reject with an error message set to stderr content if the exit code is not zero.
 *
 * @param  {ChildProcess} proc Child process with stderr set to pipe.
 * @return {Promise<void,Error>}
 */
function waitFor(proc) {
  return new Promise((resolve, reject) => {
    const stderr = new BufferList();

    proc.stderr.pipe(stderr);

    proc.on('exit', code => {
      if (code > 0) {
        reject(new GitError(proc, code, stderr.toString()));
      } else {
        resolve();
      }
    });
  });
}
