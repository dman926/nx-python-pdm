import {
  type Tree,
  type GeneratorCallback,
  ensurePackage,
  NX_VERSION,
  joinPathFragments,
  logger,
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
    projectRoot,
    rootOffset,
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

      return await applicationGenerator(tree, {
        name: `${projectName}-e2e`,
        bundler: e2eBundler,
        linter: nxLinter.EsLint,
        e2eTestRunner,
        tags,
      });
    } else {
      const desiredLinter = linter === 'none' ? nxLinter.None : nxLinter.EsLint;
      const tsconfigPath = joinPathFragments(projectRoot, 'tsconfig.json');
      let outCallback: GeneratorCallback;

      if (e2eTestRunner === 'cypress') {
        const { configurationGenerator } = ensurePackage<
          typeof import('@nx/cypress')
        >('@nx/cypress', NX_VERSION);

        outCallback = await configurationGenerator(tree, {
          project: projectName,
          linter: desiredLinter,
          directory: e2eDirectory || 'cypress',
          bundler: e2eBundler,
        });

        const e2eTestPath = joinPathFragments(
          projectRoot,
          e2eDirectory || 'cypress',
          'e2e',
          'app.cy.ts'
        );

        if (tree.exists(e2eTestPath)) {
          const updatedTestContent = `describe('${projectName}', () => {
  it('should pass', () => {
    cy.wrap(true).should('be.true');
  });
});
`;
          tree.write(e2eTestPath, updatedTestContent);
        }

        if (!tree.exists('tsconfig.base.json')) {
          // Remove extends if the base tsconfig is not there
          const { extends: _tsconfigExtends, ...tsconfigContent } = JSON.parse(
            tree.read(tsconfigPath, 'utf-8') ?? '{}'
          );

          tree.write(tsconfigPath, JSON.stringify(tsconfigContent, null, 2));
        }
      } else if (e2eTestRunner === 'playwright') {
        const { configurationGenerator } = ensurePackage<
          typeof import('@nx/playwright')
        >('@nx/playwright', NX_VERSION);

        outCallback = await configurationGenerator(tree, {
          project: projectName,
          linter: desiredLinter,
          directory: e2eDirectory || 'playwright',
          js: false,
          skipFormat: false,
          skipPackageJson: false,
          setParserOptionsProject: false,
        });

        const e2eTestPath = joinPathFragments(
          projectRoot,
          e2eDirectory || 'playwright',
          'example.spec.ts'
        );

        if (tree.exists(e2eTestPath)) {
          const updatedTestContent = `import { test, expect } from '@playwright/test';

test('sample test', async () => {
  expect(true).toBeTruthy();
});
`;
          tree.write(e2eTestPath, updatedTestContent);
        }

        // Add tsconfig
        const extended = {};
        if (tree.exists('tsconfig.base.json')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (extended as any).extends = `${rootOffset}tsconfig.base.json`;
        }
        const updatedTsConfig = {
          ...extended,
          compilerOptions: {
            allowJs: true,
            outDir: `${rootOffset}dist/out-tsc`,
            baseUrl: '.',
            module: 'commonjs',
            types: ['@playwright/test', 'node'],
            sourceMap: false,
          },
          include: [
            'playwright/**/*.ts',
            'playwright/**/*.js',
            'playwright/**/*.cy.ts',
            'playwright/**/*.cy.js',
            'playwright/**/*.d.ts',
            'playwright.config.ts',
          ],
        };
        tree.write(tsconfigPath, JSON.stringify(updatedTsConfig, null, 2));
      } else {
        logger.warn(`Unhandled e2eTestRunner: ${e2eTestRunner}`);
        outCallback = () => {};
      }

      return outCallback;
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
