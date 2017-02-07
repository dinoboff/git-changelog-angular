# git-changelog Angular

Generate a change log from git commits using angular commit convention.

## Usage

To upload an existing tag changelog to github using [hub]:

```
git changelog v1.0.0 > draft.md
hub release create --draft --file=draft.md --browse v1.1.0
```

To bump the current version and upload the changelog using npm:
```
git changelog HEAD > draft.md
export VERSION=$(head -n 1 draft.md)

npm version $VERSION
git push origin master v$VERSION
hub release create --draft --file=draft.md --browse v$VERSION

unset VERSION
```

## install

using npm:

```
npm install -g git-changelog-angular
```

## License

MIT License

Copyright (c) 2017 Damien Lebrun


[hub]: https://github.com/github/hub#installation
