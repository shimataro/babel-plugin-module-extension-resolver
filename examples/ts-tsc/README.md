# ES Modules example for TypeScript using tsc

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
node --experimental-modules ./dist/index.js
```
