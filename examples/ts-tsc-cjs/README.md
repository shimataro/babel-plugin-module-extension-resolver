# CommonJS example for TypeScript with `tsc`

## Settings

See [`package.json`](./package.json) and [`tsconfig.json`](./tsconfig.json) and [`.babelrc`](./.babelrc).

* use both `tsc` and `babel`
* set `type` to `"module"` in `package.json`
* use `module-extension-resolver` plugin in `.babelrc`

## Build

```bash
npm ci
npm run build # tsc -> babel(module-extension-resolver)
```

## Run

```bash
node ./dist/index.js
```
