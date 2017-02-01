/**
 * Compile pegjs grammar at run time; to use during development.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// eslint-disable-next-line node/no-unpublished-require
const peg = require('pegjs');

function loadGrammar() {
  return fs.readFileSync(
    path.join(__dirname, 'parser.pegjs'),
    'utf8'
  );
}

function generate() {
  return peg.generate(loadGrammar());
}

module.exports = generate();
