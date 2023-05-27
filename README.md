# nx-python-pdm

[![LICENSE](https://img.shields.io/badge/license-MIT-green)](https://github.com/dman926/nx-python-pdm/blob/main/LICENSE)
[![CI](https://github.com/dman926/nx-python-pdm/actions/workflows/ci.yml/badge.svg)](https://github.com/dman926/nx-python-pdm/actions/workflows/ci.yml)

Use Python in NX workspaces with PDM

<!--
Hidden since it's not published yet.
## Installation
```bash
pnpm add -D nx-python-pdm
## Or using yarn
# yarn add -D nx-python-pdm
## Or using npm
# npm install -D nx-python-pdm
```
-->

## Prerequisites

- An [NX workspace](https://nx.dev/)
- [PDM](https://pdm.fming.dev/) must be available to run from the NX workspace.

## Usage

### Executors

- pdm - Run a command with PDM on the project
  - command\*: The command to run. 'pdm ' is prepended to this command.
  - cwd: Override where the command runs. By default, the command runs in the project root.
  - raw: Do not prepend 'pdm ' to the given command.

### Generators

- python - Create an application or library with PDM
  - name\*: Name of the project.
  - projectType: Application or Library. Defaults to "application".
    - application
    - library
  - buildBackend: Override the default build backend.
    - pdm-backend
    - setuptools
    - flot
    - hatchling
  - directory: A diretory where the project is placed.
  - tags: Add tags to the project (used for linting).

### Targets

- build: Build the project with PDM and move the built files to `dist/{project}/`
- pdm: Allows running arbitrary PDM commands in the project through NX

Targets for `lint` and `test` are in the works, but they can always be created manually with the `pdm` executor.
