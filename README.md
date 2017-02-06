# git-changelog Angular

Generate a change log from git commits using angular commit convention.

## Usage

Release example with npm and [hub].

```
echo '' >> .gitignore
echo release.draft.md >> .gitignore

git changelog v1.0.0..HEAD > release.draft.md
npm version minor
git push origin master v1.1.0 \
hub release create --draft --file release.draft.md --browse v1.1.0
```

## install

```
npm install -g git-changelog-angular
```

## License

MIT License

Copyright (c) 2017 Damien Lebrun


[hub]: https://github.com/github/hub#installation
