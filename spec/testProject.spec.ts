import { exec } from 'child_process';
import path from 'path';

jest.setTimeout(1_000_000);

const runCommand = (command: string): Promise<string> =>
  new Promise((resolve, reject) => {
    exec(command, { cwd: path.resolve(path.join(__dirname, '/testProject/')) }, (error, stdout) => {
      if (error) {
        reject(error);
      }
      resolve(stdout);
    });
  });

const cleanup = async () => {
  try {
    await runCommand('rimraf yarn.lock');
    // Cleanup node_modules to reinstall for tests
    await runCommand('rimraf node_modules');
  } catch (error) {
    // ignored
  }
};

beforeEach(async () => {
  await cleanup();
});

describe('testProject', () => {
  it('runs eslint successfully with no errors', async () => {
    await runCommand('yarn install');

    await expect(runCommand('yarn lint')).resolves.toContain(
      // simplified successful cli output with no lint issues from eslint
      'ts-eslint-cli . --ext .ts'
    );

    await cleanup();
  });
});
