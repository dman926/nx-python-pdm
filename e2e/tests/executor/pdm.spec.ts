import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  runNxCommand,
} from '@nx/plugin/testing';

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
    const name = 'proj';
    await runNxCommandAsync(
      `generate nx-python-pdm:python --name ${name} --no-interactive`
    );
    // NX Daemon is having a hard time picking up new projects.
    // Give it a nudge.
    await runNxCommandAsync('reset');
    expect(() => runNxCommand(`build ${name}`)).not.toThrow();
    expect(() =>
      checkFilesExist(`dist/${name}/${name}-0.1.0.tar.gz`)
    ).not.toThrow();
    expect(() =>
      checkFilesExist(`dist/${name}/${name}-0.1.0-py3-none-any.whl`)
    ).not.toThrow();
  });
});
