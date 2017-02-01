import test from 'ava';
import shell from 'shelljs';

import changelog from '../';

import {tempRepo} from './helpers/index.js';

const repo = tempRepo();

async function setUpGit() {
  shell.config.silent = true;
  await repo.init();
  await repo.commit('chore: chore 1');
  await repo.git('tag', 'v0.0.0');
  await repo.commit('something');
  await repo.commit('fix: fix 1');
  await repo.commit(`revert: fix 1\n\nThis reverts commit ${await repo.hash()}.`);
  await repo.commit('fix: fix 2');
  await repo.git('tag', 'v0.1.0');
}

test.before(async () => {
  await setUpGit();
});

test.after.always(async () => {
  await repo.remove();
});

test('commits get all - non-reverted - commits with formatted messages', async t => {
  const commits = await changelog.commits({gitDir: repo.gitDir});

  t.deepEqual(commits.length, 2);
});

test('commits get all commits with formatted messages by revision range', async t => {
  const commits = await changelog.commits({rev: 'v0.0.0..v0.1.0', gitDir: repo.gitDir});

  t.deepEqual(commits.length, 1);
});

test('mapper parses commit message', t => {
  const commit = {message: 'fix: fix 1'};
  const parsedCommit = changelog.mapper(commit);

  t.deepEqual(parsedCommit.type, 'fix');
});

test('mapper extends commits', t => {
  const commit = {message: 'fix: fix 1'};
  const parsedCommit = changelog.mapper(commit);

  t.not(parsedCommit, commit);
});

test('mapper returns undefined if the commit has message', t => {
  t.is(changelog.mapper(), undefined);
  t.is(changelog.mapper({}), undefined);
  t.is(changelog.mapper({message: ''}), undefined);
});

test('mapper returns undefined if the commit has no valid type', t => {
  t.is(changelog.mapper({message: 'foo bar'}), undefined);
  t.is(changelog.mapper({message: 'foo: bar'}), undefined);
});

test('changes sorts and filter commit by types', t => {
  const commits = [
    {type: 'fix', title: 'fix 1', hash: '1111111'},
    {type: 'fix', title: 'fix 2', hash: '1111112'},
    {type: 'feat', title: 'feat 1', hash: '1111113'},
    {type: 'feat', title: 'feat 2', hash: '1111114'},
    {type: 'chore', title: 'chore 1', hash: '1111115'}
  ];
  const changes = changelog.changes(commits);

  t.is(changes.length, 2);
  t.deepEqual(changes[0], {
    type: 'feat',
    name: 'Feature',
    description: 'new functionality',
    commits: [
      {type: 'feat', title: 'feat 1', hash: '1111113'},
      {type: 'feat', title: 'feat 2', hash: '1111114'}
    ]
  });
  t.deepEqual(changes[1], {
    type: 'fix',
    name: 'Bug Fix',
    description: 'bug fix',
    commits: [
      {type: 'fix', title: 'fix 1', hash: '1111111'},
      {type: 'fix', title: 'fix 2', hash: '1111112'}
    ]
  });
});

test('changes return types only if they have a commit', t => {
  const commits = [
    {type: 'fix', title: 'fix 1', hash: '1111111'},
    {type: 'chore', title: 'chore 1', hash: '1111115'}
  ];
  const changes = changelog.changes(commits);

  t.is(changes.length, 1);
  t.deepEqual(changes[0], {
    type: 'fix',
    name: 'Bug Fix',
    description: 'bug fix',
    commits: [
      {type: 'fix', title: 'fix 1', hash: '1111111'}
    ]
  });
});

test('changes order commit by scope', t => {
  const commits = [
    {type: 'fix', scope: 'foo', title: 'foo 1', hash: '1111114'},
    {type: 'fix', scope: 'bar', title: 'bar 2', hash: '1111113'},
    {type: 'fix', scope: 'bar', title: 'bar 1', hash: '1111112'},
    {type: 'fix', scope: null, title: 'no scope', hash: '1111111'}
  ];
  const changes = changelog.changes(commits);

  t.deepEqual(
    changes[0].commits.map(c => c.title).join(','),
    'no scope,bar 2,bar 1,foo 1'
  );
});

test('changes returns an empty array if there are no commits', t => {
  t.deepEqual(changelog.changes(), []);
  t.deepEqual(changelog.changes([]), []);
});

test('filter returns an empty array if there are no commits', t => {
  t.deepEqual(changelog.filter(), []);
  t.deepEqual(changelog.filter([]), []);
});

test('breakingChanges filter in the commits with breaking changes', t => {
  const commits = [
    {type: 'fix', title: 'fix 1', hash: '1111111'},
    {type: 'chore', title: 'chore 1', hash: '1111115', breakingChanges: 'Breaks foo'}
  ];
  const withBreakingChanges = changelog.breakingChanges(commits);

  t.is(withBreakingChanges.length, 1);
  t.deepEqual(withBreakingChanges[0].title, 'chore 1');
});

test('create generate changelog', async t => {
  const log = await changelog.create({gitDir: repo.gitDir});

  t.deepEqual(log.match(/###.*/), ['### Bug Fix']);
  t.deepEqual(log.match(/- .* [0-9a-f]{7}/).map(m => m.slice(0, -7)), ['- fix 2 ']);
});
