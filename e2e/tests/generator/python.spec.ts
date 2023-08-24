import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
} from '@nx/plugin/testing';

describe.skip('python generator', () => {
  beforeAll(() => {
    ensureNxProject('nx-python-pdm', 'dist/nx-python-pdm');
  });

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  it('should be able to generated project files', async () => {
    const name = 'generate-proj';
    const baseDir = `apps/${name}`;
    await runNxCommandAsync(
      `generate nx-python-pdm:python --name ${name} --no-interactive`
    );
    expect(() =>
      checkFilesExist(
        ...['main.py', 'pyproject.toml'].map((el) => `${baseDir}/${el}`)
      )
    ).not.toThrow();
  });
});
