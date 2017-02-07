/**
 * Infer new version
 */

'use strict';

const semver = require('semver');

module.exports = exports = {

  /**
   * Infer the release version from the changes and the previous version.
   *
   * A breaking changes, backward compatible features and bug fixes require
   * minimum major, minor and patch increase, with the following exception:
   *
   * - prerelease can include and changes.
   * - 0.x.x never infer to 1.0.0 and may include breaking changes between
   * minor increases.
   * - 0.0.x never infer to 0.1.0 and may include breaking changes and new
   * feature between patch increases.
   *
   * @param  {object} release Release context
   * @return {string}
   */
  inc(release) {
    const {previous: version} = release;
    const prev = semver.parse(version);
    const type = exports.type(prev, release);
    const identifier = exports.identifier(prev, release);

    return semver.inc(version, type, false, identifier);
  },

  /**
   * return the change type according the change type, release type
   * (stable/prerelease) and the alpha/beta context (<1.0.0).
   *
   * @param  {object}         prev                    Parsed previous version
   * @param  {string}         options.identifier      New version identifier
   * @param  {Changes}        options.changes         List of changes by type
   * @param  {ParsedCommit[]} options.breakingChanges List of commit with breaking changes
   * @return {string}
   */
  type(prev, {identifier, changes, breakingChanges}) {
    const wasPrerelease = prev.prerelease.length > 0;
    const isPrerelease = identifier != null;

    if (wasPrerelease) {
      return isPrerelease ? 'prerelease' : 'patch';
    }

    const changeType = exports.changeType({changes, breakingChanges});
    const type = exports.translate[changeType](prev);

    return isPrerelease ? `pre${type}` : type;
  },

  /**
   * Check the new version prerelease identifier is greater than the previous
   * one.
   *
   * Return which ever is greater or undefined if the new version is not a
   * prerelease.
   *
   * @param  {object} prev       Details of the previous version
   * @param  {string} identifier Identifier candidate
   * @return {string|void}
   */
  identifier(prev, {identifier}) {
    if (identifier == null) {
      return;
    }

    if (prev.prerelease.length === 0 || typeof prev.prerelease[0] === 'number') {
      return identifier;
    }

    const result = semver.compare(`0.0.0-${prev.prerelease[0]}.0`, `0.0.0-${identifier}.0`);

    return result > 0 ? prev.prerelease[0] : identifier;
  },

  /**
   * Return change type for >=1.0.0 versions.
   *
   * @param  {ParsedCommit[]} options.breakingChanges List of commit with breaking changes
   * @param  {Changes[]}      options.changes         List of changes type.
   * @return {string}
   */
  changeType({breakingChanges, changes}) {
    const hasBreakingChanges = breakingChanges != null && breakingChanges.length > 0;

    if (hasBreakingChanges) {
      return 'major';
    }

    const hasFeat = changes.filter(group => group.type === 'feat').pop() != null;

    return hasFeat ? 'minor' : 'patch';
  },

  /**
   * Adjust change type to the alpha/beta context.
   *
   * Version 0.0.x (and their prerelease) might include breaking changes and
   * new feature.
   *
   * version 0.x.x might include Breaking changes.
   *
   * @type {string}
   */
  translate: {

    major(prev) {
      if (prev.major !== 0) {
        return 'major';
      }

      return prev.minor === 0 ? 'patch' : 'minor';
    },

    minor(prev) {
      const isAlpha = prev.major === 0 && prev.minor === 0;

      return isAlpha ? 'patch' : 'minor';
    },

    patch() {
      return 'patch';
    }

  }

};
