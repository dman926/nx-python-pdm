import {
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

describe('application generator', () => {
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

  it('should create nx-python3 application', async () => {
    // TODO: use this test to check that project files are present
    expect(true).toBeTruthy();
  }, 120000);
});
