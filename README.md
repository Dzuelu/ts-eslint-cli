# ts-eslint-cli
A drop in solution to be able to use typescript with eslint config files.

[![Version](https://img.shields.io/npm/v/ts-eslint-cli.svg)](https://www.npmjs.com/package/ts-eslint-cli)

# Example
`.eslint.ts`
```typescript
import { ESLint } from 'eslint';

const config: ESLint.ConfigData = {
  extends: ['eslint:recommended']
  // Full typing support for fields
};

export default config;
```

Then just replace calls to `eslint` with `ts-eslint-cli` and you get the best of both worlds!
```sh
$ yarn ts-eslint-cli . --ext .ts
```

## How it works
This package will transpile the eslint config and save it in the package folder in node_modules.
Then it passes any args (minus any config file passed) to eslint passing instead it's own arg for config.
