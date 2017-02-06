#!/usr/bin/env node

'use strict';

const changelog = require('../');
const cli = require('../lib/cli');

const config = cli.config();

changelog.create(config)
  .then(console.log)
  .catch(err => {
    console.error(err.stack);
    config.showHelp();
    process.exit(1);
  });
