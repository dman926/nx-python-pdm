import {
  type Tree,
  type GeneratorCallback,
  ensurePackage,
  NX_VERSION,
} from '@nx/devkit';
import { isNodeE2ETestRunner, isPythonE2ETestRunner } from '../constants';
import { type NormalizedOptions } from '../utils';

export const addE2E = async (
  tree: Tree,
  {
    e2eTestRunner,
    separateE2eProject,
    e2eDirectory,
    e2eBundler,
    projectName,
    linter,
    tags: tagsInput,
  }: NormalizedOptions
): Promise<GeneratorCallback> => {
  const tags = `${tagsInput ? `${tagsInput},` : ''}e2e`;

  if (isNodeE2ETestRunner(e2eTestRunner)) {
    const { Linter: nxLinter } = ensurePackage<typeof import('@nx/eslint')>(
      '@nx/eslint',
      NX_VERSION
    );

    if (separateE2eProject) {
      const { applicationGenerator } = ensurePackage<typeof import('@nx/web')>(
        '@nx/web',
        NX_VERSION
      );

      await applicationGenerator(tree, {
        name: `${projectName}-e2e`,
        bundler: e2eBundler,
        linter: nxLinter.EsLint,
        e2eTestRunner,
        tags,
      });
    } else {
      const desiredLinter = linter === 'none' ? nxLinter.None : nxLinter.EsLint;

      if (e2eTestRunner === 'cypress') {
        const { configurationGenerator } = ensurePackage<
          typeof import('@nx/cypress')
        >('@nx/cypress', NX_VERSION);

        return await configurationGenerator(tree, {
          project: projectName,
          linter: desiredLinter,
          directory: e2eDirectory,
          bundler: e2eBundler,
        });
      } else if (e2eTestRunner === 'playwright') {
        const { configurationGenerator } = ensurePackage<
          typeof import('@nx/playwright')
        >('@nx/playwright', NX_VERSION);

        return await configurationGenerator(tree, {
          project: projectName,
          linter: desiredLinter,
          directory: '',
          js: false,
          skipFormat: false,
          skipPackageJson: false,
          setParserOptionsProject: false,
        });
      }
    }
  } else if (isPythonE2ETestRunner(e2eTestRunner)) {
    // Is a python E2E test runner. Use python project
    if (separateE2eProject) {
      // Create a separate @dman926/nx-pdm-python:python project for E2E
      // Dynamic import to avoid circular dependency
      return (await import('../generator')).pythonGenerator(tree, {
        name: `${projectName}-e2e`,
        projectType: 'application',
        e2eTestRunner: e2eTestRunner,
        directory: e2eDirectory,
        linter,
        separateE2eProject: false,
        tags,
      });
    }
    // Otherwise do nothing since pythonGenerator GeneratorCallback will handle it
  }
  return () => {};
};
