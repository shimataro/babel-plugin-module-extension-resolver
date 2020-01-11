# CommonJS example for TypeScript with `@babel/preset-typescript`

## Settings

See [`package.json`](./package.json) and [`.babelrc`](./.babelrc).

* set `type` to `"module"` in `package.json`
* specify `"@babel/preset-env": "7.7.5"` in `package.json` (**exactly** `"7.7.5"`; neigher `"^7.7.5"` nor `"~7.7.5"`)
* set `modules` to `false` in `.babelrc`
* use `module-extension-resolver` plugin in `.babelrc`

## Build

```bash
npm ci
npm run build
```

## Run

```bash
node ./dist/index.js
```
