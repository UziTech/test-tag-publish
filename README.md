# Archived

We recommend using [semantic-release](https://github.com/semantic-release/semantic-release) instead

# Overview

This package will do the following:

1.  Check for uncommitted changes.
2.  Run tests.
3.  Update the version number.
4.  Commit the version number.
5.  Tag the commit.
6.  Push all commits and tags.
7.  Publish to npm.

# Usage

Install:

```sh
npm i -g test-tag-publish
```

Run:

```sh
test-tag-publish <version> [options]
```

# Parameters

*   `<version>`
    *   This is required and can be anything that [`npm version`](https://docs.npmjs.com/cli/version) accepts.
    *   \[`<newversion>` | `major` | `minor` | `patch` | `premajor` | `preminor` | `prepatch` | `prerelease` | `from-git`]
*   `[options]`
    *   \[`-m` | `--message`]
        *   The commit message.
        *   `%s` can be used to insert the new version number.
        *   Default value is `v%s`.
    *   \[`-t` | `--tag`]
        *   The tag message.
        *   `%s` can be used to insert the new version number.
        *   If this is not set the message is used.
    *   \[`-f` | `--force`]
        *   Skip the check for uncommitted changes.
    *   \[`-n` | `--no-test`]
        *   Skip tests.
