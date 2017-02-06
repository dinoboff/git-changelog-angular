import test from 'ava';

import changelog from '../';

const {parser} = changelog;

//
// With a break footer
//
const WITH_BREAK = `feat($browser): onUrlChange event (popstate/hashchange/polling)

Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available

Breaks $browser.onHashChange, which was removed (use onUrlChange instead)`;

test('parse commit message with breaking change', matchCommit, WITH_BREAK, {
  type: 'feat',
  scope: '$browser',
  title: 'onUrlChange event (popstate/hashchange/polling)',

  body: `Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available`,

  breakingChanges: ['Breaks $browser.onHashChange, which was removed (use onUrlChange instead)'],
  issues: null,
  revert: null
});

//
// With an issue
//
const WITH_FIX = `fix($compile): couple of unit tests for IE9

Older IEs serialize html uppercased, but IE9 does not...
Would be better to expect case insensitive, unfortunately jasmine does
not allow to user regexps for throw expectations.

Closes #392`;

test('parse commit message with an issue reference', matchCommit, WITH_FIX, {
  type: 'fix',
  scope: '$compile',
  title: 'couple of unit tests for IE9',

  body: `Older IEs serialize html uppercased, but IE9 does not...
Would be better to expect case insensitive, unfortunately jasmine does
not allow to user regexps for throw expectations.`,

  breakingChanges: null,
  issues: '#392',
  revert: null
});

//
// With both and breaking change
//
const WITH_FIX_AND_BREAK = `fix($compile): couple of unit tests for IE9

Older IEs serialize html uppercased, but IE9 does not...
Would be better to expect case insensitive, unfortunately jasmine does
not allow to user regexps for throw expectations.

Closes #392
Breaks foo.bar api, foo.baz should be used instead`;

test('parse commit message with an issue reference and a breaking change', matchCommit, WITH_FIX_AND_BREAK, {
  type: 'fix',
  scope: '$compile',
  title: 'couple of unit tests for IE9',

  body: `Older IEs serialize html uppercased, but IE9 does not...
Would be better to expect case insensitive, unfortunately jasmine does
not allow to user regexps for throw expectations.`,

  breakingChanges: ['Breaks foo.bar api, foo.baz should be used instead'],
  issues: '#392',
  revert: null
});

//
// With no footer
//
const WITHOUT_FOOTER = `fix($compile): couple of unit tests for IE9

Older IEs serialize html uppercased, but IE9 does not...
Would be better to expect case insensitive, unfortunately jasmine does
not allow to user regexps for throw expectations.`;

test('parse commit message with no footer', matchCommit, WITHOUT_FOOTER, {
  type: 'fix',
  scope: '$compile',
  title: 'couple of unit tests for IE9',

  body: `Older IEs serialize html uppercased, but IE9 does not...
Would be better to expect case insensitive, unfortunately jasmine does
not allow to user regexps for throw expectations.`,

  breakingChanges: null,
  issues: null,
  revert: null
});

//
// With no body
//
const WITHOUT_BODY = `fix($compile): couple of unit tests for IE9

Closes #392
Breaks foo.bar api, foo.baz should be used instead`;

test('parse commit message with footer and no body', matchCommit, WITHOUT_BODY, {
  type: 'fix',
  scope: '$compile',
  title: 'couple of unit tests for IE9',
  body: null,
  breakingChanges: ['Breaks foo.bar api, foo.baz should be used instead'],
  issues: '#392',
  revert: null
});

//
// With full breaking changes description
//
const WITH_FULL_CHANGES = `feat($compile): simplify isolate scope bindings

Changed the isolate scope binding options to:
  - @attr - attribute binding (including interpolation)
  - =model - by-directional model binding
  - &expr - expression execution binding

This change simplifies the terminology as well as
number of choices available to the developer. It
also supports local name aliasing from the parent.

BREAKING CHANGE: isolate scope bindings definition has changed and
the inject option for the directive controller injection was removed.

To migrate the code follow the example below:

Before:

scope: {
  myAttr: 'attribute',
  myBind: 'bind',
  myExpression: 'expression',
  myEval: 'evaluate',
  myAccessor: 'accessor'
}

After:

scope: {
  myAttr: '@',
  myBind: '@',
  myExpression: '&',
  // myEval - usually not useful, but in cases where the expression is assignable, you can use '='
  myAccessor: '=' // in directive's template change myAccessor() to myAccessor
}

The removed \`inject\` wasn't generaly useful for directives so there should be no code using it.`;

test('feat($compile): simplify isolate scope bindings', matchCommit, WITH_FULL_CHANGES, {
  type: 'feat',
  scope: '$compile',
  title: 'simplify isolate scope bindings',

  body: `Changed the isolate scope binding options to:
  - @attr - attribute binding (including interpolation)
  - =model - by-directional model binding
  - &expr - expression execution binding

This change simplifies the terminology as well as
number of choices available to the developer. It
also supports local name aliasing from the parent.`,

  issues: null,
  revert: null,

  breakingChanges: [`isolate scope bindings definition has changed and
the inject option for the directive controller injection was removed.

To migrate the code follow the example below:

Before:

scope: {
  myAttr: 'attribute',
  myBind: 'bind',
  myExpression: 'expression',
  myEval: 'evaluate',
  myAccessor: 'accessor'
}

After:

scope: {
  myAttr: '@',
  myBind: '@',
  myExpression: '&',
  // myEval - usually not useful, but in cases where the expression is assignable, you can use '='
  myAccessor: '=' // in directive's template change myAccessor() to myAccessor
}

The removed \`inject\` wasn't generaly useful for directives so there should be no code using it.`]

});

//
// Subject missing scope
//
const WITHOUT_SCOPE = `feat: onUrlChange event (popstate/hashchange/polling)

Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available

Breaks $browser.onHashChange, which was removed (use onUrlChange instead)`;

test('parse commit message without scope', matchCommit, WITHOUT_SCOPE, {
  type: 'feat',
  scope: null,
  title: 'onUrlChange event (popstate/hashchange/polling)',

  body: `Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available`,

  breakingChanges: ['Breaks $browser.onHashChange, which was removed (use onUrlChange instead)'],
  issues: null,
  revert: null
});

//
// Subject with global scope
//
const WITH_GLOBAL_SCOPE = `feat(*): onUrlChange event (popstate/hashchange/polling)

Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available

Breaks $browser.onHashChange, which was removed (use onUrlChange instead)`;

test('parse commit message with global scope', matchCommit, WITH_GLOBAL_SCOPE, {
  type: 'feat',
  scope: null,
  title: 'onUrlChange event (popstate/hashchange/polling)',

  body: `Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available`,

  breakingChanges: ['Breaks $browser.onHashChange, which was removed (use onUrlChange instead)'],
  issues: null,
  revert: null
});

//
// Subject missing type
//
const WITH_NO_TYPE = `onUrlChange event (popstate/hashchange/polling)

Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available

Breaks $browser.onHashChange, which was removed (use onUrlChange instead)`;

test('parse commit message with missing type', matchCommit, WITH_NO_TYPE, {
  type: null,
  scope: null,
  title: 'onUrlChange event (popstate/hashchange/polling)',

  body: `Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available`,

  breakingChanges: ['Breaks $browser.onHashChange, which was removed (use onUrlChange instead)'],
  issues: null,
  revert: null
});

//
// Basic message
//
const WITH_JUST_TITLE = `onUrlChange event (popstate/hashchange/polling)`;

test('parse commit basic message', matchCommit, WITH_JUST_TITLE, {
  type: null,
  scope: null,
  title: 'onUrlChange event (popstate/hashchange/polling)',
  body: null,
  breakingChanges: null,
  issues: null,
  revert: null
});

//
// Revert message
//
const WITH_REVERT_HASH = `revert: onUrlChange event (popstate/hashchange/polling)

This reverts commit 1111111111111111111111111111111111111111.`;

test('parse commit revert message', matchCommit, WITH_REVERT_HASH, {
  type: 'revert',
  scope: null,
  title: 'onUrlChange event (popstate/hashchange/polling)',
  body: 'This reverts commit 1111111111111111111111111111111111111111.',
  breakingChanges: null,
  issues: null,
  revert: '1111111111111111111111111111111111111111'
});

function matchCommit(t, input, expected) {
  const commit = parser.parse(input);
  const issues = Array.isArray(commit.issues) ? commit.issues.join(',') : commit.issues;

  t.deepEqual(commit.type, expected.type);
  t.deepEqual(commit.scope, expected.scope);
  t.deepEqual(commit.title, expected.title);
  t.deepEqual(commit.body, expected.body);
  t.deepEqual(commit.breakingChanges, expected.breakingChanges);
  t.deepEqual(commit.revert, expected.revert);
  t.deepEqual(issues, expected.issues);
}
