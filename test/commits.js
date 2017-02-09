import test from 'ava';
import shell from 'shelljs';

import commits from '../lib/commits';

import {tempRepo} from './helpers/index.js';

const {get} = commits;
const repo = tempRepo();

async function setUpGit() {
  shell.config.silent = true;
  await repo.init();

  await repo.commit('chore: chore 1');
  await repo.git('tag', 'v0.0.0');

  await repo.commit('feat: feat1');
  await repo.git('tag', 'v0.1.0');

  await repo.commit('fix: fix 1');

  await repo.git('checkout', '-q', '-b', 'pr1');
  await repo.commit('fix: pr 1');
  await repo.git('checkout', '-q', 'master');

  await repo.commit('perf: perf 1');
  await repo.commit('revert: fix 1');
  await repo.git('merge', 'pr1');
  await repo.commit('fix: fix 2');
  await repo.git('tag', 'v0.1.1');
}

test.before(async () => {
  await setUpGit();
});

test.after.always(async () => {
  await repo.remove();
});

test('query all commits by default', async t => {
  const commits = await get({client: repo.client});

  t.is(commits.length, 7);
});

test('query commits by topologic order', async t => {
  const commits = await get({client: repo.client});

  t.deepEqual(commits.map(c => c.message.split('\n')[0]), [
    'fix: fix 2',
    'fix: pr 1',
    'revert: fix 1',
    'perf: perf 1',
    'fix: fix 1',
    'feat: feat1',
    'chore: chore 1'
  ]);
});

test('query revision range', async t => {
  const commits = await get({rev: ['^v0.0.0', 'v0.1.0'], client: repo.client});

  t.deepEqual(commits[0].message, 'feat: feat1');
});

test('query commit hash', async t => {
  const commits = await get({rev: ['v0.0.0..v0.1.0'], client: repo.client});

  t.is(commits[0].hash.length, 40);
});

test('query commit author', async t => {
  const commits = await get({rev: ['v0.0.0..v0.1.0'], client: repo.client});

  t.deepEqual(commits[0].author.name, 'Bob Smith');
  t.deepEqual(commits[0].author.email, 'bob@example.com');
});

test('query commit committer', async t => {
  const commits = await get({rev: ['v0.0.0..v0.1.0'], client: repo.client});

  t.deepEqual(commits[0].committer.name, 'Alice Smith');
  t.deepEqual(commits[0].committer.email, 'alice@example.com');
});

test('map commit', async t => {
  const commits = await get({
    client: repo.client,
    rev: ['v0.0.0..v0.1.0'],
    mapper: commit => commit.message
  });

  t.deepEqual(commits[0], 'feat: feat1');
});

test('map commit asynchronously', async t => {
  const commits = await get({
    client: repo.client,
    rev: ['v0.0.0..v0.1.0'],
    mapper: commit => Promise.resolve(commit.message)
  });

  t.deepEqual(commits[0], 'feat: feat1');
});

test('reject if mapper throws', async t => {
  const err = await t.throws(get({
    client: repo.client,
    rev: ['v0.0.0..v0.1.0'],
    mapper: commit => commit.foo.bar.baz
  }));

  t.regex(err.message, /cannot read property 'bar' of undefined/i);
});
