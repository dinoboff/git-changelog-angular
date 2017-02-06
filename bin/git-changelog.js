#!/usr/bin/env node

'use strict';

const changelog = require('../');
const cli = require('../lib/cli');

cli.config()
  .then(config => changelog.create(config))
  .then(console.log)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
