import test from 'ava';
import version from '../lib/version';

// 1.0.0 context
test('release from 1.0.0 with patch change', matchInc, release({hasFix: true}), '1.0.1');
test('release from 1.0.0 with minor change', matchInc, release({hasFeat: true}), '1.1.0');
test('release from 1.0.0 with major change', matchInc, release({hasFeat: true, breaks: true}), '2.0.0');

// 0.1.0 context
test('release from 0.1.0 with patch change', matchInc, release({prev: '0.1.0', hasFix: true}), '0.1.1');
test('release from 0.1.0 with minor change', matchInc, release({prev: '0.1.0', hasFeat: true}), '0.2.0');
test('release from 0.1.0 with major change', matchInc, release({prev: '0.1.0', hasFeat: true, breaks: true}), '0.2.0');

// 0.0.1 context
test('release from 0.0.1 with patch change', matchInc, release({prev: '0.0.1', hasFix: true}), '0.0.2');
test('release from 0.0.1 with minor change', matchInc, release({prev: '0.0.1', hasFeat: true}), '0.0.2');
test('release from 0.0.1 with major change', matchInc, release({prev: '0.0.1', hasFeat: true, breaks: true}), '0.0.2');

test('release from 1.0.0-beta.1 with patch changes', matchInc, release({prev: '1.0.0-beta.1', hasFix: true}), '1.0.0');
test('release from 1.0.0-beta.1 with minor changes', matchInc, release({prev: '1.0.0-beta.1', hasFeat: true}), '1.0.0');
test('release from 1.0.0-beta.1 with major changes', matchInc, release({prev: '1.0.0-beta.1', breaks: true}), '1.0.0');

test('beta release from 1.0.0-0 with patch changes', matchInc, release({prev: '1.0.0-0', identifier: 'alpha', hasFix: true}), '1.0.0-alpha.0');
test('beta release from 1.0.0-beta.1 with patch changes', matchInc, release({prev: '1.0.0-beta.1', identifier: 'beta', hasFix: true}), '1.0.0-beta.2');
test('beta release from 1.0.0-beta.1 with minor changes', matchInc, release({prev: '1.0.0-beta.1', identifier: 'beta', hasFeat: true}), '1.0.0-beta.2');
test('beta release from 1.0.0-beta.1 with major changes', matchInc, release({prev: '1.0.0-beta.1', identifier: 'beta', breaks: true}), '1.0.0-beta.2');
test('alpha release from 1.0.0-beta.1 with patch changes', matchInc, release({prev: '1.0.0-beta.1', identifier: 'alpha', hasFix: true}), '1.0.0-beta.2');
test('rc release from 1.0.0-beta.1 with patch changes', matchInc, release({prev: '1.0.0-beta.1', identifier: 'rc', hasFix: true}), '1.0.0-rc.0');

function matchInc(t, release, expected) {
  t.is(version.inc(release), expected);
}

function release({
  hasFix = false,
  hasFeat = false,
  breaks = false,
  prev = '1.0.0',
  identifier
}) {
  const breakingChanges = breaks ? [{}] : [];
  const changes = [];
  const previous = prev;

  if (hasFeat) {
    changes.push({type: 'feat'});
  }

  if (hasFix) {
    changes.push({type: 'fix'});
  }

  return {
    breakingChanges,
    changes,
    previous,
    identifier
  };
}
