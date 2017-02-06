import path from 'path';

import shell from 'shelljs';
import tempfile from 'tempfile';

import git from '../../lib/git';

export function tempRepo() {
  const repo = tempfile();
  const gitDir = path.join(repo, '.git');
  const client = git({gitDir});

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
      await client(['init', repo]);
      await this.git('config', 'user.name', name);
      await this.git('config', 'user.email', email);
    },

    async git(...args) {
      return client(args, {capture: true});
    },

    async commit(subject, lines = [], author = 'Bob Smith <bob@example.com>') {
      const msg = [subject].concat('', lines).join('\n').trim();

      return this.git('commit', '--allow-empty', `--author=${author}`, `--message=${msg}`);
    },

    async hash(rev = 'HEAD') {
      const result = await this.git('rev-parse', rev);

      return result.trim();
    },

    remove() {
      shell.rm('-rf', repo);
    }

  };
}

