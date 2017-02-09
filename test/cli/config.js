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
  next: null,
  printHeader: true
});

test('config with "--any" flag', matchConfig, args('--any'), {
  rev: ['HEAD', '^v0.1.0-0'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: '0.1.0-0',
  next: null,
  printHeader: true
});

test('config with "--identifier" flag', matchConfig, args('--identifier', 'beta'), {
  rev: ['HEAD', '^v0.1.0-0'],
  gitDir: repo.gitDir,
  identifier: 'beta',
  previous: '0.1.0-0',
  next: null,
  printHeader: true
});

test('config with revision', matchConfig, args('master'), {
  rev: ['master', '^v0.0.0'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: '0.0.0',
  next: null,
  printHeader: true
});

test('config with tagged revision', matchConfig, args('stable'), {
  rev: ['stable', '^v0.0.0'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: '0.0.0',
  next: '0.1.0',
  printHeader: true
});

test('config without previous tag', matchConfig, args('master~4'), {
  rev: ['master~4'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: null,
  next: null,
  printHeader: true
});

test('config with revision range', matchConfig, args('HEAD', '^HEAD~2'), {
  rev: ['HEAD', '^HEAD~2'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: null,
  next: null,
  printHeader: true
});

test('config with dotted revision range', matchConfig, args('HEAD~2..HEAD'), {
  rev: ['HEAD', '^HEAD~2'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: null,
  next: null,
  printHeader: true
});

test('config without header', matchConfig, args('--no-header', 'HEAD', '^HEAD~2'), {
  rev: ['HEAD', '^HEAD~2'],
  gitDir: repo.gitDir,
  identifier: undefined,
  previous: null,
  next: null,
  printHeader: false
});

test('config client with --git-dir', async t => {
  const config = await cli.config(['--git-dir', repo.gitDir]);
  const gitDir = await config.client(['rev-parse', '--git-dir'], {capture: true});

  t.is(gitDir.trim(), repo.gitDir);
});

function args(...args) {
  return ['--git-dir', repo.gitDir, ...args];
}

async function matchConfig(t, args, expected) {
  const fns = ['client', 'showHelp'];
  const config = await cli.config(args);
  const expectedConfig = Object.assign(expected, {
    rev: await Promise.all(expected.rev.map(r => repo.hash(r)))
  });

  t.deepEqual(omit(config, fns), omit(expectedConfig, fns));
  t.is(typeof config.client, 'function');
  t.is(typeof config.showHelp, 'function');
}
