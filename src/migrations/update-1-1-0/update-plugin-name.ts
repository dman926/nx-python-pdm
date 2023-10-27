/* eslint-disable @typescript-eslint/no-unused-vars */
import { getProjects, Tree, updateProjectConfiguration } from '@nx/devkit';

export function updatePluginName(tree: Tree) {
  const projects = getProjects(tree);

  for (const [name, project] of projects) {
    if (project.targets) {
      for (const [targetName, target] of Object.entries(project.targets)) {
        if (target.executor?.startsWith('nx-python-pdm:')) {
          // Prepend `@dman926/` to the executor name
          project.targets[
            targetName
          ].executor = `@dman926/${project.targets[targetName].executor}`;
          updateProjectConfiguration(tree, name, project);
        }
      }
    }
  }
}

export default updatePluginName;
