import {
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

describe.skip('pipenv executor', () => {
  let project: string;

  beforeAll(async () => {
    project = uniq('nx-python3');
    ensureNxProject('@dman926/nx-python3', 'dist/libs/nx-python3');
    await runNxCommandAsync(
      `generate @dman926/nx-python3:application ${project} --no-interactive`
    );
  });

  afterAll(async () => {
    // Clean up virtualenv
    await runNxCommandAsync(
      `generate @nrwl/workspace:remove ${project} --no-interactive`
    );
    // Clean up project
    await runNxCommandAsync('reset');
  });

  it('should run pipenv executor successfully', async () => {
    const result = await runNxCommandAsync(`pipenv ${project} --command=check`);
    expect(result.stdout).toContain('Executor ran');
  });
});
