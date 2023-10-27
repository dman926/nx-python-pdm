import {
  type ProjectConfiguration,
  addProjectConfiguration,
  getProjects,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';

import { updatePluginName } from './update-plugin-name';

interface TestProjectConfig {
  name: string;
  config: ProjectConfiguration;
}

describe('update-plugin-name migration', () => {
  let tree: Tree;

  const expectOldPluginNameNotPresent = (tree: Tree) => {
    const projects = getProjects(tree);

    for (const [, project] of projects) {
      if (project.targets) {
        for (const target of Object.values(project.targets)) {
          expect(target.executor).not.toMatch(/^nx-python-pdm/);
        }
      }
    }
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully with no projects', () => {
    expect(() => updatePluginName(tree)).not.toThrow();
    expectOldPluginNameNotPresent(tree);
  });

  it('should run successfully with projects', () => {
    // Test setup
    const testProjects: TestProjectConfig[] = [
      {
        name: 'test-na-app',
        config: {
          root: 'apps/test-na-app',
          projectType: 'application',
          sourceRoot: 'apps/test-na-app/src',
          targets: {
            build: {
              executor: 'nx:run-command',
              options: {
                cmd: 'echo "I am not a python target"',
              },
            },
          },
          tags: ['not-affiliated'],
        },
      },
      {
        name: 'test-a-1-app',
        config: {
          root: 'apps/test-a-1-app',
          projectType: 'application',
          sourceRoot: 'apps/test-a-1-app/src',
          targets: {
            build: {
              executor: 'nx:run-command',
              options: {
                cmd: 'echo "I am not a python target"',
              },
            },
            test: {
              executor: 'nx-python-pdm:pdm',
            },
          },
          tags: ['not-affiliated'],
        },
      },
      {
        name: 'test-a-2-app',
        config: {
          root: 'apps/test-a-2-app',
          projectType: 'application',
          sourceRoot: 'apps/test-a-2-app/src',
          targets: {
            build: {
              executor: 'nx-python-pdm:pdm',
            },
            test: {
              executor: 'nx-python-pdm:pdm',
            },
          },
          tags: ['not-affiliated'],
        },
      },
    ];

    testProjects.forEach(({ name, config }) => {
      addProjectConfiguration(tree, name, config);
    });

    // End test setup

    updatePluginName(tree);

    expectOldPluginNameNotPresent(tree);
  });
});
