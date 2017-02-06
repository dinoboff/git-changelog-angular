import test from 'ava';
import omit from 'lodash.omit';

import cli from '../../lib/cli';
import {tempRepo} from '../helpers/index.js';

const repo = tempRepo();

test.before(async () => {
  await repo.init();
});

test.after.always(async () => {
  await repo.remove();
});
test('default config', matchConfig, [], {
  rev: ['HEAD'],
  gitDir: undefined
});

test('config with revision list', matchConfig, ['^foo', 'bar'], {
  rev: ['^foo', 'bar'],
  gitDir: undefined
});

test('config with --git-dir', matchConfig, ['--git-dir', './.git'], {
  rev: ['HEAD'],
  gitDir: '.git'
});

test('config client with --git-dir', async t => {
  const config = cli.config(['--git-dir', repo.gitDir]);
  const gitDir = await config.client(['rev-parse', '--git-dir'], {capture: true});

  t.is(gitDir.trim(), repo.gitDir);
});

function matchConfig(t, args, expected) {
  const fns = ['client', 'showHelp'];
  const config = cli.config(args);

  t.deepEqual(omit(config, fns), omit(expected, fns));
  t.is(typeof config.client, 'function');
  t.is(typeof config.showHelp, 'function');
}
