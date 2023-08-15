import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { ModuleKind, transpileModule } from 'typescript';
import { run } from '../src';

jest.mock('fs');
jest.mock('child_process');
jest.mock('typescript', () => {
  // Need actual typescript package so ts-node can run this test
  const actual = jest.requireActual('typescript');
  return {
    ...actual,
    transpileModule: jest.fn().mockImplementation((...args) => {
      try {
        return actual.transpileModule(args);
      } catch (error) {
        return 'ignored';
      }
    })
  };
});

beforeEach(() => {
  // Default happy paths
  process.argv = ['node_path', 'ts-eslint-cli', '.', '--ext', '.ts'];
  (existsSync as jest.Mock).mockReturnValue(true);
  (readFileSync as jest.Mock).mockReturnValue('some_typescript_file');
  (transpileModule as jest.Mock).mockReturnValue({ outputText: 'some_transpiled_text' });
  // (writeFileSync as jest.Mock).mockReturnValue(undefined);
  // (exec as unknown as jest.Mock).mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation();
  jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit');
  });
});

describe('ts-eslint-cli', () => {
  describe('when --config is given', () => {
    it('validates the config ends with ts', async () => {
      process.argv = ['node_path', 'ts-eslint-cli', '.', '-c', 'some/given/path.js', '--ext', '.ts'];

      await expect(run()).rejects.toThrowError('process.exit');

      expect(console.error).toHaveBeenCalledWith('ts-eslint-cli: Given config file is not a typescript file!');
    });

    it('validates the config file exists', async () => {
      process.argv = ['node_path', 'ts-eslint-cli', '.', '--config', 'some/given/path.ts', '--ext', '.ts'];
      (existsSync as jest.Mock).mockReturnValue(false);

      await expect(run()).rejects.toThrowError('process.exit');

      expect(console.error).toHaveBeenCalledWith('ts-eslint-cli: Given config file does not exist!');
    });

    it('calls readFileSync on passed config path', async () => {
      process.argv = ['node_path', 'ts-eslint-cli', '.', '-c', 'some/given/path.ts', '--ext', '.ts'];

      await expect(run()).resolves.toBeUndefined();

      expect(readFileSync).toHaveBeenCalledWith('some/given/path.ts');
    });
  });

  describe('when --config not given', () => {
    it('tries to find a config file and errors if it cant', async () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      await expect(run()).rejects.toThrowError('process.exit');

      expect(existsSync).toHaveBeenCalledWith('eslint.ts');
      expect(existsSync).toHaveBeenCalledWith('.eslint.ts');
      expect(existsSync).toHaveBeenCalledWith('eslintrc.ts');
      expect(existsSync).toHaveBeenCalledWith('.eslintrc.ts');
      expect(console.error).toHaveBeenCalledWith('ts-eslint-cli: Unable to find a typescript eslint file!');
    });

    it('calls readFileSync on config path', async () => {
      await expect(run()).resolves.toBeUndefined();

      expect(readFileSync).toHaveBeenCalledWith('eslint.ts');
    });
  });

  it('calls transpileModule on returned data', async () => {
    (readFileSync as jest.Mock).mockReturnValue('some_typescript_file');

    await expect(run()).resolves.toBeUndefined();

    expect(transpileModule).toHaveBeenCalledWith('some_typescript_file', {
      compilerOptions: { module: ModuleKind.CommonJS }
    });
  });

  it('calls writeFileSync on with a static path to node_modules and output from transpileModule', async () => {
    (transpileModule as jest.Mock).mockReturnValue({ outputText: 'some_transpiled_text' });

    await expect(run()).resolves.toBeUndefined();

    expect(writeFileSync).toHaveBeenCalledWith(
      './node_modules/ts-eslint-cli/transpiledConfig.js',
      'some_transpiled_text'
    );
  });

  it('calls exec with any given args and added config path', async () => {
    process.argv = ['node_path', 'ts-eslint-cli', '.', '--config', 'some/given/path.ts', '--ext', '.ts'];

    await expect(run()).resolves.toBeUndefined();

    expect(exec).toHaveBeenCalledWith('eslint . --ext .ts --config ./node_modules/ts-eslint-cli/transpiledConfig.js');
  });
});
