/**
 * Render change log data.
 *
 * @typedef {function(context: object): string} Template
 * @typedef {{toHtml: function(): string, tosString: function(): string}} SafeString
 */

'use strict';

// Packages
const handlebars = require('handlebars');
const pluralize = require('pluralize');

const escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

const badChars = /[&<>]/g;

function escapeChar(chr) {
  return escape[chr];
}

/**
 * Only escape html special characters.
 *
 * Leave quote quotes unescape; os it's not suitable for html attribute content.
 *
 * @param  {string} content Content to escape
 * @return {SafeString}
 */
function mdEscape(content) {
  return new handlebars.SafeString(
    content.replace(badChars, escapeChar)
  );
}

/**
 * Indent multi line content.
 *
 * @param  {string} content             Content to indent
 * @param  {string} options.hash.indent Ident to pad lines with
 * @return {string}
 */
function mdListIndent(content, {hash: {indent = '  '} = {}}) {
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    return lines.pop();
  }

  const indented = lines
    .map(line => `${indent}${line}`.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim();

  return `${indented}\n`;
}

/**
 * pluralize words
 *
 * @param  {string} name               Expression to plurize.
 * @param  {number} options.hash.count Number to test with.
 * @return {string}
 */
function plural(name, {hash: {count = 0} = {}}) {
  return pluralize(name, count);
}

/**
 * Slice an array or string.
 *
 * @param  {string|array} arr                  Sequence to slice
 * @param  {number}       [options.hash.start] Starting point of slice
 * @param  {number}       [options.hash.end]   Ending point of slice
 * @return {string|array}
 */
function slice(arr, {hash: {start = 0, end} = {}}) {
  return arr.slice(start, end);
}

handlebars.registerHelper('md', mdEscape);
handlebars.registerHelper('mdListIndent', mdListIndent);
handlebars.registerHelper('plural', plural);
handlebars.registerHelper('slice', slice);

const defaultSource = `
{{~#each changes ~}}
  ### {{plural name count=commits.length}}

  {{#each commits ~}}
    -{{#if scope}} {{scope}}:{{/if}} {{md title}} {{slice hash end=7}}
  {{/each}}

{{/each}}

{{~#if breakingChanges ~}}
  ### BREAKING CHANGES

  {{#each breakingChanges ~}}
    {{#each breakingChanges ~}}
      - {{md (mdListIndent .)}}
    {{/each}}
  {{/each}}

{{/if}}
`;

/**
 * Compile a changelog template.
 *
 * @param  {string} [source] Handlebar template source.
 * @return {Template}
 */
exports.create = function (source = defaultSource) {
  return handlebars.compile(source);
};

/**
 * Render changelog data.
 *
 * @param  {object}   context                  Changelog data
 * @param  {object}   options                  Options
 * @param  {string}   [options.templateSource] Source to compile default template
 * @param  {Template} [options.template]       Template to render data with
 * @return {string}
 */
exports.render = function (context = {}, options = {}) {
  const {templateSource, template = exports.create(templateSource)} = options;

  if (
    context.commits == null ||
    context.commits.length < 1
  ) {
    throw new Error('No changes happened since the last release.');
  }

  return template(context);
};
