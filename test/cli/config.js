import test from 'ava';
import omit from 'lodash.omit';

import cli from '../../lib/cli';
import {tempRepo} from '../helpers/index.js';

const repo = tempRepo();

test.before(async () => {
  await repo.init();
  await repo.commit('chore: chore 1');
  await repo.commit('chore: chore 2');
  await repo.git('tag', 'v0.0.0');
  await repo.commit('feat: feat1');
  await repo.commit('feat: feat2');
  await repo.git('tag', 'v0.1.0-0');
  await repo.commit('fix: fix1');

  await repo.git('checkout', '-b', 'stable');
  await repo.commit('fix: fix2');
  await repo.git('tag', 'v0.1.0');

  await repo.git('checkout', 'master');
});

test.after.always(async () => {
  await repo.remove();
});

test('default config', matchConfig, ['--git-dir', repo.gitDir], {
  rev: ['HEAD', '^v0.0.0'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: '0.0.0',
  printHeader: true
});

test('config with "--any" flag', matchConfig, ['--any', '--git-dir', repo.gitDir], {
  rev: ['HEAD', '^v0.1.0-0'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: '0.1.0-0',
  printHeader: true
});

test('config with "--identifier" flag', matchConfig, ['--identifier', 'beta', '--git-dir', repo.gitDir], {
  rev: ['HEAD', '^v0.1.0-0'],
  gitDir: repo.gitDir,
  identifier: 'beta',
  previous: '0.1.0-0',
  printHeader: true
});

test('config with revision', matchConfig, ['--git-dir', repo.gitDir, 'master'], {
  rev: ['master', '^v0.0.0'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: '0.0.0',
  printHeader: true
});

test('config with tagged revision', matchConfig, ['--git-dir', repo.gitDir, 'stable'], {
  rev: ['stable', '^v0.0.0'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: '0.0.0',
  printHeader: true
});

test('config without previous tag', matchConfig, ['--git-dir', repo.gitDir, 'master~4'], {
  rev: ['master~4'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: undefined,
  printHeader: true
});

test('config with revision range', matchConfig, ['^foo', 'bar'], {
  rev: ['^foo', 'bar'],
  gitDir: undefined,
  identifier: undefined,
  previous: undefined,
  printHeader: true
});

test('config with dotted revision range', matchConfig, ['foo..bar'], {
  rev: ['foo..bar'],
  gitDir: undefined,
  identifier: undefined,
  previous: undefined,
  printHeader: true
});

test('config with "--git-dir" flag', matchConfig, ['--git-dir', './.git', '^foo', 'bar'], {
  rev: ['^foo', 'bar'],
  gitDir: '.git',
  identifier: undefined,
  previous: undefined,
  printHeader: true
});

test('config without header', matchConfig, ['--no-header', '^foo', 'bar'], {
  rev: ['^foo', 'bar'],
  gitDir: undefined,
  identifier: undefined,
  previous: undefined,
  printHeader: false
});

test('config client with --git-dir', async t => {
  const config = await cli.config(['--git-dir', repo.gitDir]);
  const gitDir = await config.client(['rev-parse', '--git-dir'], {capture: true});

  t.is(gitDir.trim(), repo.gitDir);
});

async function matchConfig(t, args, expected) {
  const fns = ['client', 'showHelp'];
  const config = await cli.config(args);

  t.deepEqual(omit(config, fns), omit(expected, fns));
  t.is(typeof config.client, 'function');
  t.is(typeof config.showHelp, 'function');
}
