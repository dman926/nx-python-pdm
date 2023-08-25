import {
  checkFilesExist,
  listFiles,
  ensureNxProject,
  runNxCommandAsync,
  runNxCommand,
  runCommandAsync,
  uniq,
} from '@nx/plugin/testing';

const cleanup = async (name: string) => {
  await runNxCommandAsync(
    `generate @nx/workspace:remove --projectName=${name} --no-interactive`
  );
};

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
    const name = uniq('build-executor-test');
    await runNxCommandAsync(
      `generate nx-python-pdm:python --name ${name} --no-interactive`
    );
    expect(() => runNxCommand(`build ${name}`)).not.toThrow();

    const filesInDirectory = listFiles(`dist/${name}`);
    filesInDirectory.unshift(`Files present in dist/${name}`);

    expect(() =>
      checkFilesExist(
        `dist/${name}/${name}-0.1.0.tar.gz`,
        `dist/${name}/${name.replace(/-/g, '_')}-0.1.0-py3-none-any.whl`
      )
    ).not.toThrowWithAdditional(undefined, filesInDirectory.join('\n'));
    cleanup(name);
  });

  it('should be able to serve generated projects', async () => {
    const name = uniq('serve-executor-test');
    await runNxCommandAsync(
      `generate nx-python-pdm:python --name ${name} --no-interactive`
    );
    let serveOutput = '';
    const expectedOutput =
      '\n' +
      `> nx run ${name}:serve\n` +
      '\n' +
      'Hello World\n' +
      '\n' +
      ' \n' +
      '\n' +
      ` >  NX   Successfully ran target serve for project ${name}\n` +
      '\n' +
      '\n';
    expect(() => {
      serveOutput = runNxCommand(`serve ${name}`);
    }).not.toThrow();
    expect(serveOutput).toBe(expectedOutput);
    // cleanup(name);
  });

  ['unittest', 'pytest'].forEach((testRunner) => {
    it(`should be able to run tests on generated projects with ${testRunner}`, async () => {
      const name = uniq(`${testRunner}-test-executor-test`);
      await runNxCommandAsync(
        `generate nx-python-pdm:python --name ${name} --unitTestRunner ${testRunner} --no-interactive`
      );

      // Create dummy test file
      const testFilePath = `apps/${name}/tests/test_dummy.py`;
      await runCommandAsync(
        `echo "def test_dummy():\\n    assert True" > ${testFilePath}`
      );

      let output = '';
      expect(
        () => (output = runNxCommand(`test ${name}`))
      ).not.toThrowWithAdditional(undefined, output);
      cleanup(name);
    });
  });

  ['pylint', 'flake8', 'pycodestyle', 'pylama', 'mypy'].forEach((linter) => {
    it.only(`should be able to run linting on generated projects with ${linter}`, async () => {
      const name = uniq(`${linter}-linting-executor-test`);
      await runNxCommandAsync(
        `generate nx-python-pdm:python --name ${name} --linter ${linter} --no-interactive`
      );

      let output = '';
      expect(
        () => (output = runNxCommand(`lint ${name}`))
      ).not.toThrowWithAdditional(undefined, output);
      cleanup(name);
    });
  });
});
