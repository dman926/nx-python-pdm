import type { ProjectType } from '@nx/devkit';
import {
  pythonInstallableFilters,
  setJoin,
  type NormalizedOptions,
} from '../utils';
import type { BuildBackend } from '../schema';

export const pdmInitCommand = (
  projectType: ProjectType,
  buildBackend?: BuildBackend
) => {
  const pdmInitCommands = new Set<string>();
  if (projectType === 'library') {
    pdmInitCommands.add('--lib');
  }
  if (buildBackend) {
    pdmInitCommands.add(`--backend=${buildBackend}`);
  }
  pdmInitCommands.add('--non-interactive');

  return `init ${setJoin(pdmInitCommands, ' ')}`;
};

export const pdmInstallCommand = ({
  linter,
  typeChecker,
  unitTestRunner,
  e2eTestRunner,
}: NormalizedOptions) => {
  const pdmInstallCommands = new Set<string>(['setuptools']);
  [
    linter,
    typeChecker,
    pythonInstallableFilters.filterUnitTestRunner(unitTestRunner),
    pythonInstallableFilters.filterE2ERunner(e2eTestRunner),
  ]
    // Remove undefined and 'none' values
    .filter(
      (pkg): pkg is Exclude<typeof pkg, undefined | 'none'> =>
        pkg !== undefined && pkg !== 'none'
    )
    .forEach((pkg) => {
      pdmInstallCommands.add(pkg);
    });

  if (pdmInstallCommands.size) {
    return `add -d ${setJoin(pdmInstallCommands, ' ')}`;
  }

  return null;
};
