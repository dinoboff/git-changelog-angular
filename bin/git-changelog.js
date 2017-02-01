#!/usr/bin/env node

'use strict';

const changelog = require('../');

const [rev = 'HEAD'] = process.argv.slice(2);

changelog.create({rev})
  .then(console.log)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
