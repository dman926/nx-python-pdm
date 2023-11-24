import {
  type Tree,
  type GeneratorCallback,
  addProjectConfiguration,
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
    parsedTags,
  }: NormalizedOptions
): Promise<GeneratorCallback> => {
  const tags = `${tagsInput ? `${tagsInput},` : ''}e2e`;

  if (isNodeE2ETestRunner(e2eTestRunner)) {
    const { Linter: nxLinter } = ensurePackage<typeof import('@nx/eslint')>(
      '@nx/eslint',
      NX_VERSION
    );

    let desiredName = projectName;
    let desiredRoot = projectRoot;

    if (separateE2eProject) {
      desiredName = `${desiredName}-e2e`;
      desiredRoot = joinPathFragments(desiredRoot, '..', desiredName);
      addProjectConfiguration(tree, desiredName, {
        root: desiredRoot,
        projectType: 'application',
        sourceRoot: `${desiredRoot}/${e2eDirectory || e2eTestRunner}`,
        targets: {},
        implicitDependencies: [projectName],
        tags: [...parsedTags, 'e2e'],
      });
    }
    const desiredLinter = linter === 'none' ? nxLinter.None : nxLinter.EsLint;
    const tsconfigPath = joinPathFragments(desiredRoot, 'tsconfig.json');
    let outCallback: GeneratorCallback;

    if (e2eTestRunner === 'cypress') {
      const { configurationGenerator } = ensurePackage<
        typeof import('@nx/cypress')
      >('@nx/cypress', NX_VERSION);

      outCallback = await configurationGenerator(tree, {
        project: desiredName,
        linter: desiredLinter,
        directory: e2eDirectory || 'cypress',
        bundler: e2eBundler,
        devServerTarget: `${projectName}:serve`,
      });

      const e2eTestPath = joinPathFragments(
        desiredRoot,
        e2eDirectory || 'cypress',
        'e2e',
        'app.cy.ts'
      );

      if (tree.exists(e2eTestPath)) {
        const updatedTestContent = `describe('${desiredName}', () => {
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
        project: desiredName,
        linter: desiredLinter,
        directory: e2eDirectory || 'playwright',
        js: false,
        skipFormat: false,
        skipPackageJson: false,
        setParserOptionsProject: false,
        webServerCommand: `npx -y nx serve ${projectName}`,
      });

      const e2eTestPath = joinPathFragments(
        desiredRoot,
        e2eDirectory || 'playwright',
        'example.spec.ts'
      );

      if (tree.exists(e2eTestPath)) {
        let updatedTestContent = `import { test, expect } from '@playwright/test';

test('sample test', async () => {
  expect(true).toBeTruthy();
});
`;

        // Special case for E2E testing because playwright and jest don't play well together
        const isE2ETest = tagsInput?.includes('E2E-TESTING');
        if (isE2ETest) {
          const tmpContent = updatedTestContent
            .split('\n')
            .map((line) => `// ${line}`);
          tmpContent.unshift(
            '// File is commented out because of tags[] = "E2E-TESTING"',
            ''
          );
          updatedTestContent = tmpContent.join('\n');
        }

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

    // Prevent the generator callback from running in jest test because it breaks
    if (!tags.includes('JEST-TEST')) {
      return outCallback;
    }
  } else if (isPythonE2ETestRunner(e2eTestRunner)) {
    // Is a python E2E test runner. Use python project
    if (separateE2eProject) {
      // Create a separate @dman926/nx-pdm-python:python project for E2E
      // Dynamic import to avoid circular dependency
      const { pythonGenerator } = await import('../generator');
      return await pythonGenerator(tree, {
        name: `${projectName}-e2e`,
        projectType: 'application',
        e2eTestRunner: e2eTestRunner,
        directory: e2eDirectory,
        linter,
        separateE2eProject: false,
        implicitDependencies: [projectName],
        tags,
      });
    }
    // Otherwise do nothing since pythonGenerator GeneratorCallback will handle it
  }
  return () => {};
};
