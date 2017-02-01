import test from 'ava';
import template from '../lib/template';

test('render patch changes', renderMatch, {
  commits: [
    {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111'},
    {type: 'fix', scope: 'foo', title: 'fix 2', hash: '1111112'},
    {type: 'chore', title: 'chore 1', hash: '1111115'}
  ],
  changes: [{
    name: 'Bug Fix',
    commits: [
      {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111'},
      {type: 'fix', scope: 'foo', title: 'fix 2', hash: '1111112'}
    ]
  }],
  breakingChanges: []
}, `### Bug Fixes

- bar: fix 1 1111111
- foo: fix 2 1111112

`);

test('render minor changes', renderMatch, {
  commits: [
    {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111'},
    {type: 'fix', scope: 'foo', title: 'fix 2', hash: '1111112'},
    {type: 'feat', title: 'feat 1', hash: '1111113'},
    {type: 'chore', title: 'chore 1', hash: '1111115'}
  ],
  changes: [{
    name: 'Feature',
    commits: [
      {type: 'feat', title: 'feat 1', hash: '1111113'}
    ]
  }, {
    name: 'Bug Fix',
    commits: [
      {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111'},
      {type: 'fix', scope: 'foo', title: 'fix 2', hash: '1111112'}
    ]
  }],
  breakingChanges: []
}, `### Feature

- feat 1 1111113

### Bug Fixes

- bar: fix 1 1111111
- foo: fix 2 1111112

`);

test('render major changes', renderMatch, {
  commits: [
    {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111', breakingChanges: ['Breaks foo.bar.']}
  ],
  changes: [{
    name: 'Bug Fix',
    commits: [
      {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111', breakingChanges: ['Breaks foo.bar.']}
    ]
  }],
  breakingChanges: [
    {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111', breakingChanges: ['Breaks foo.bar.']}
  ]
}, `### Bug Fix

- bar: fix 1 1111111

### BREAKING CHANGES

- Breaks foo.bar.

`);

test('render major changes with long breaking changes', renderMatch, {
  commits: [
    {type: 'fix', scope: 'foo', title: 'fix 2', hash: '1111112', breakingChanges: [`two line
header.

        Some indented text.

some footer.`]},
    {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111', breakingChanges: ['Breaks foo.bar.']}
  ],
  changes: [{
    name: 'Bug Fix',
    commits: [
      {type: 'fix', scope: 'foo', title: 'fix 2', hash: '1111112', breakingChanges: [`two line
header.

        Some indented text.

some footer.`]},
      {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111', breakingChanges: ['Breaks foo.bar.']}
    ]
  }],
  breakingChanges: [
    {type: 'fix', scope: 'foo', title: 'fix 2', hash: '1111112', breakingChanges: [`two line
header.

        Some indented text.

some footer.`]},
    {type: 'fix', scope: 'bar', title: 'fix 1', hash: '1111111', breakingChanges: ['Breaks foo.bar.']}
  ]
}, `### Bug Fixes

- foo: fix 2 1111112
- bar: fix 1 1111111

### BREAKING CHANGES

- two line
  header.

          Some indented text.

  some footer.

- Breaks foo.bar.

`);

function renderMatch(t, context, expected) {
  const changelog = template.render(context);

  t.deepEqual(changelog, expected);
}
