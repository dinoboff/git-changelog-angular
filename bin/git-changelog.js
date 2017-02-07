#!/usr/bin/env node

'use strict';

const changelog = require('../');
const cli = require('../lib/cli');

cli.config()
  .then(printLog)
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });

function printLog(config) {
  return changelog.context(config)
    .then(context => {
      const log = changelog.render(context, config);

      if (!config.printHeader) {
        return log;
      }

      const version = changelog.inferVersion(context);

      return `${version == null ? context.revision : version}\n\n${log.trim()}\n\n`;
    })
    .then(console.log);
}
