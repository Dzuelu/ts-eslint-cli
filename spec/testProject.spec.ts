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

    await expect(runCommand('yarn lint')).resolves.toStrictEqual(
      // The actual successful cli output with no lint issues from eslint
      '\u001b[2K\u001b[1G\u001b[2m$ ts-eslint-cli . --ext .ts\u001b[22m\n'
    );

    await cleanup();
  });
});
