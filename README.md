# babel-plugin-module-extension-resolver

[![Build Status (Windows)][image-build-windows]][link-build-windows]
[![Build Status (macOS)][image-build-macos]][link-build-macos]
[![Build Status (Linux)][image-build-linux]][link-build-linux]
[![Syntax check][image-syntax-check]][link-syntax-check]
[![Release][image-release]][link-release]
[![Node.js version][image-engine]][link-engine]
[![License][image-license]][link-license]

Babel plugin that resolves and maps module extensions.

Inspired by [babel-plugin-extension-resolver](https://www.npmjs.com/package/babel-plugin-extension-resolver).

## Install

```bash
npm i -D babel-plugin-module-extension-resolver
```

## Examples

* [ECMAScript using `@babel/preset-env`](./examples/babel/README.md)
* [TypeScript using `@babel/preset-typescript`](./examples/ts-babel/README.md)
* [TypeScript using `tsc` and Babel](./examples/ts-tsc/README.md)

## `.babelrc`

```json
{
  "plugins": ["module-extension-resolver"]
}
```

With options:

```json
{
  "plugins": [["module-extension-resolver", {
    "extensions": [".mjs", ".js", ".es", ".es6", ".ts", ".node", ".json"],
    "map": {
      ".ts": ".js",
      ".es": ".js",
      ".es6": ".js",
      ".node": ".js"
    }
  }]]
}
```

## Options

### `extensions`

extensions to resolve

**defaults:**

```json
[
  ".mjs",
  ".js",
  ".es",
  ".es6",
  ".ts",
  ".node",
  ".json"
]
```

### `map`

extension mapper

**defaults:**

```json
{
  ".ts": ".js",
  ".es": ".js",
  ".es6": ".js",
  ".node": ".js"
}
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

[image-build-windows]: https://github.com/shimataro/babel-plugin-module-extension-resolver/workflows/Windows/badge.svg
[link-build-windows]: https://github.com/shimataro/babel-plugin-module-extension-resolver
[image-build-macos]: https://github.com/shimataro/babel-plugin-module-extension-resolver/workflows/macOS/badge.svg
[link-build-macos]: https://github.com/shimataro/babel-plugin-module-extension-resolver
[image-build-linux]: https://github.com/shimataro/babel-plugin-module-extension-resolver/workflows/Linux/badge.svg
[link-build-linux]: https://github.com/shimataro/babel-plugin-module-extension-resolver
[image-syntax-check]: https://github.com/shimataro/babel-plugin-module-extension-resolver/workflows/Syntax%20check/badge.svg
[link-syntax-check]: https://github.com/shimataro/babel-plugin-module-extension-resolver
[image-release]: https://img.shields.io/github/release/shimataro/babel-plugin-module-extension-resolver.svg
[link-release]: https://github.com/shimataro/babel-plugin-module-extension-resolver/releases
[image-engine]: https://img.shields.io/node/v/babel-plugin-module-extension-resolver.svg
[link-engine]: https://nodejs.org/
[image-license]: https://img.shields.io/github/license/shimataro/babel-plugin-module-extension-resolver.svg
[link-license]: ./LICENSE
