# ES Modules example using `@babel/preset-env`

## Settings

See [`package.json`](./package.json) and [`.babelrc`](./.babelrc).

* specify `"@babel/preset-env": "7.7.5"` in `package.json` (**exactly** `"7.7.5"`; neigher `"^7.7.5"` nor `"~7.7.5"`)
* use `module-extension-resolver` plugin in `.babelrc`

## Build

Below command builds two types of file:

* `./dist/*.js`: for CommonJS
* `./dist/*.mjs`: for ES Modules

```bash
npm ci
npm run build
```

## Run

```bash
# for CommonJS
node ./dist/index.js
# for ES Modules
node --experimental-modules ./dist/index.mjs
```
