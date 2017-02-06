'use strict';

const yargs = require('yargs');

const git = require('../git');

module.exports = function (argv = process.argv.slice(2)) {
  yargs
    .usage('Usage: $0 [--git-dir=path] [-h] [revision..]')
    .help('help')
    .options({

      help: {
        alias: 'h',
        type: 'boolean'
      },

      'git-dir': {
        description: 'Path to the git repository',
        default: process.env.GIT_DIR,
        normalize: true
      }

    });

  const {gitDir, _: revList} = yargs.parse(argv);
  const rev = revList != null && revList.length > 0 ? revList : ['HEAD'];

  return {
    rev,
    gitDir,
    client: git({gitDir}),
    showHelp: yargs.showHelp
  };

};
