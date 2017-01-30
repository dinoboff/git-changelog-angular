# git-changelog Angular

Generate a change log from git commits using angular commit convention.

## Usage

By default, `git-changelog` will bump the version  in "./VERSION" and output the
change log to stdout. To release a new version with `git-changelog` and `[hub]`
in your path:

```
git changelog v1.0.0..HEAD > dev.log \
  && npm version $(cat VERSION) \
  && git push origin master "v$(cat VERSION)" \
  && hub release create --draft --file dev.log --browse "v$(cat VERSION)" \
  && rm dev.log
```

## install

```
npm install git-changelog-angular
```

## License

MIT License

Copyright (c) 2017 Damien Lebrun


[hub]: https://github.com/github/hub#installation
