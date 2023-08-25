import { runNxCommandAsync } from '@nx/plugin/testing';

/**
 * Cleans up a project by removing it using the Nx CLI.
 *
 * @param {string} name - The name of the project to be removed.
 * @return {Promise<void>} - A promise that resolves when the project has been removed.
 */
export const cleanup = async (name: string): Promise<void> => {
  await runNxCommandAsync(
    `generate @nx/workspace:remove --projectName=${name} --no-interactive`
  );
};
