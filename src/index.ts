import { exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ModuleKind, transpileModule } from 'typescript';

export const run = async () => {
  const args = process.argv.slice(2);
  let lintConfigFile: string;

  const configCommand = ['-c', '--config'].find(command => args.indexOf(command) >= 0);
  if (configCommand != null) {
    const commandIndex = args.indexOf(configCommand);
    lintConfigFile = args[commandIndex + 1]; // get given config path
    args.splice(commandIndex, 2); // remove given config path so we can use our own later

    if (!lintConfigFile.endsWith('.ts')) {
      console.error('ts-eslint-cli: Given config file is not a typescript file!');
      process.exit(2);
    }
    if (!existsSync(lintConfigFile)) {
      console.error('ts-eslint-cli: Given config file does not exist!');
      process.exit(2);
    }
  } else {
    const foundConfigFile = ['eslint.ts', '.eslint.ts', 'eslintrc.ts', '.eslintrc.ts'].find(file => existsSync(file));
    if (foundConfigFile == null) {
      console.error('ts-eslint-cli: Unable to find a typescript eslint file!');
      process.exit(2);
    }
    lintConfigFile = foundConfigFile;
  }

  const transpiledConfig = transpileModule(readFileSync(lintConfigFile).toString('utf-8'), {
    compilerOptions: { module: ModuleKind.CommonJS }
  });

  const jsConfigPath = './node_modules/ts-eslint-cli/transpiledConfig.js';
  writeFileSync(jsConfigPath, transpiledConfig.outputText);

  args.push('--config', jsConfigPath);
  // Is there a better way to do this? Prefer to pass config to eslint?
  await exec(`eslint ${args.join(' ')}`);
};
