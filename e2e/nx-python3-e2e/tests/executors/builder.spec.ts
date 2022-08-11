import {
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

describe('builder executor', () => {
  let project: string;

  beforeEach(async () => {
    project = uniq('python3');
    ensureNxProject('@dman926/nx-python3', 'dist/packages/nx-python3');
    await runNxCommandAsync(
      `generate @dman926/nx-python3:application ${project} --no-interactive`
    );
  }, 45000);

  afterEach(async () => {
    // Clean up pipenv
    await runNxCommandAsync(`run ${project}:clean`);
    await runNxCommandAsync(
      `generate @nrwl/workspace:remove ${project} --no-interactive`
    );
    // Clean up project
    await runNxCommandAsync('reset');
  });

  it('should run build executor successfully', async () => {
    const result = await runNxCommandAsync(`build ${project}`);
    expect(result.stdout).toContain('Executor ran');
  });
});
