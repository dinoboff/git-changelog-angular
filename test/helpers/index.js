import path from 'path';

import shell from 'shelljs';
import tempfile from 'tempfile';
import gitPromise from 'git-spawned-promise';

export function tempRepo() {
  const repo = tempfile();
  const gitDir = path.join(repo, '.git');
  const client = gitPromise({gitDir});

  return {

    get client() {
      return client;
    },

    get repo() {
      return repo;
    },

    get gitDir() {
      return gitDir;
    },

    async init(name = 'Alice Smith', email = 'alice@example.com') {
      shell.mkdir('-p', repo);
      await client.run('init', repo);
      await client.run('config', 'user.name', name);
      await client.run('config', 'user.email', email);
    },

    async git(...args) {
      return client(args);
    },

    async commit(subject, lines = [], author = 'Bob Smith <bob@example.com>') {
      const msg = [subject].concat('', lines).join('\n').trim();

      await client.run('commit', '--allow-empty', `--author=${author}`, `--message=${msg}`);
    },

    async hash(rev = 'HEAD') {
      return client.get('rev-parse', rev);
    },

    remove() {
      shell.rm('-rf', repo);
    }

  };
}

