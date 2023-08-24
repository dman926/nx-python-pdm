import {
  checkFilesExist,
  listFiles,
  ensureNxProject,
  runNxCommandAsync,
  runNxCommand,
} from '@nx/plugin/testing';

const cleanup = async (name: string) => {
  await runNxCommandAsync(
    `generate @nx/workspace:remove --projectName=${name} --no-interactive`
  );
};

const buildOutputPath = (name: string, fileName: string) =>
  `dist/${name}/${fileName}`;

describe('pdm executor', () => {
  beforeAll(() => {
    ensureNxProject('nx-python-pdm', 'dist/nx-python-pdm');
  });

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  it('should be able to build generated projects', async () => {
    const name = 'build-executor-test';
    await runNxCommandAsync(
      `generate nx-python-pdm:python --name ${name} --no-interactive`
    );
    expect(() => runNxCommand(`build ${name}`)).not.toThrow();

    const filesInDirectory = listFiles(`dist/${name}`);
    filesInDirectory.unshift(`Files present in dist/${name}`);

    // Output a list of the files in `dist/${name}` with the rejected promise(s) expected filename(s) when either promise rejects
    const outputName = name.replace('-', '_');

    // !!! This is throwing but the error message makes it look like it shouldn't be !!!
    expect(() =>
      checkFilesExist(
        buildOutputPath(name, `${outputName}-0.1.0.tar.gz`),
        buildOutputPath(name, `${outputName}-0.1.0-py3-none-any.whl`)
      )
    ).not.toThrowWithAdditional(undefined, filesInDirectory.join('\n'));
    cleanup(name);
  });

  it.skip('should be able to serve generated projects', async () => {
    const name = 'serve-executor-test';
    await runNxCommandAsync(
      `generate nx-python-pdm:python --name ${name} --no-interactive`
    );
    let serveOutput = '';
    expect(() => {
      serveOutput = runNxCommand(`serve ${name}`);
    }).not.toThrow();
    expect(serveOutput).toBe('Hello World');
    // cleanup(name);
  });

  const testRunners = ['unittest', 'pytest', 'pyre'];
  it.skip(`should be able to run tests on generated projects`, async () => {
    for (const testRunner of testRunners) {
      const name = `${testRunner}-test-executor-test`;
      await runNxCommandAsync(
        `generate nx-python-pdm:python --name ${name} --unitTestRunner ${testRunner} --no-interactive`
      );
      expect(() => runNxCommand(`test ${name}`)).not.toThrow();
      cleanup(name);
    }
  });
});
