import test from 'ava';
import sinon from 'sinon';
import yargs from 'yargs';

import cli from '../../lib/cli';

test.beforeEach(() => sinon.stub(yargs, 'showHelp'));

test.afterEach.always(() => yargs.showHelp.restore());

test('parse rev from argv', t => {
  t.deepEqual(cli.config([]), {
    rev: ['HEAD'],
    gitDir: undefined,
    showHelp: yargs.showHelp
  });

  t.deepEqual(cli.config(['foo', '^bar']), {
    rev: ['foo', '^bar'],
    gitDir: undefined,
    showHelp: yargs.showHelp
  });
});

test('parse gitDir from argv', t => {
  t.deepEqual(cli.config([]), {
    rev: ['HEAD'],
    gitDir: undefined,
    showHelp: yargs.showHelp
  });

  t.deepEqual(cli.config(['--git-dir=./.git']), {
    rev: ['HEAD'],
    gitDir: '.git',
    showHelp: yargs.showHelp
  });
});
