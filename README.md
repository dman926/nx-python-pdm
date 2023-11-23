# @dman926/nx-python-pdm

[![LICENSE](https://img.shields.io/badge/license-MIT-green)](https://github.com/dman926/nx-python-pdm/blob/main/LICENSE)
[![CI](https://github.com/dman926/nx-python-pdm/actions/workflows/ci.yml/badge.svg)](https://github.com/dman926/nx-python-pdm/actions/workflows/ci.yml)
[![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/dman926/nx-python-pdm/main)](https://github.com/dman926/nx-python-pdm/blob/main/package.json)

Use Python in NX workspaces with PDM

## Installation

```bash
## Using pnpm
pnpm add -D @dman926/nx-python-pdm

## Or using npm
npm install -D @dman926/nx-python-pdm

## Or using yarn
yarn add -D @dman926/nx-python-pdm
```

## Prerequisites

- An [NX workspace](https://nx.dev/)
- [PDM](https://pdm.fming.dev/) must be available to run from a terminal in the NX workspace.

## Usage

### Executors

- pdm - Run a command with PDM on the project
  - command\*: The command to run. 'pdm ' is prepended to this command.
    - The default input is used for command as well. It is important to note that the remainder of the PDM command must still be wrapped in quotes.
    - Ex: `nx run my-project:pdm --command="add -d wheel"`
    - Ex: `nx run my-project:pdm "add -d wheel"`
  - cwd: Override where the command runs. By default, the command runs in the project root. If provided, it should be relative to the workspace root or an absolute path.
  - raw: Do not prepend `'pdm '` to the given command.
  - quiet: Suppress output to stdout. stderr will still be printed on process error.

### Generators

- python - Create an application or library with PDM
  - name\*: Name of the project.
  - projectType\*: Application or Library.
    - application (default)
    - library
  - buildBackend: Override the PDM default build backend.
    - pdm-backend
    - setuptools
    - flot
    - hatchling
  - ~~separateE2eProject: Scaffold the E2E configuration in a separate project. Defaults to `true`.~~ _In progress_
  - e2eTestRunner: The tool to use for running E2E tests.
    - _In progress. This technically works for having a runner and target added to the project directly, but it is untested and needs a flag and a generator to be added to create it as a separate E2E project. Also the generator will not create the e2e target if you pick robotframework, but it will install it._
    - cypress
    - robotframework
  - linter: The tool to use for running lint checks.
    - pylint
    - flake8
    - pycodestyle
    - pylama
    - mypy
  - typeChecker: The tool to use for running type checks.
    - mypy
    - pyright
    - pyre
  - unitTestRunner: The tool to use for running unit tests.
    - unittest (default)
    - pytest
  - directory: A diretory where the project is placed.
  - tags: Add tags to the project (used for linting).

### Targets

- build: Build the project with PDM and move the built files to `dist/{projectRoot}/`
- serve: Run `src` with PDM.
- test: Run unit tests with the selected unit test runner.
- lint: Run lint checks with the selected linter.
- typeCheck: Run type checks with the selected tool.
- e2e: Run end-to-end tests with the selected test runner.
  - _In progress. It technically works, but it is missing tests. It's also not created automatically by the python generator except for cypress_
- pdm: Allows running arbitrary PDM commands in the project through NX.
  - See [Executors](#Executors) for examples.

### TODOs

- Complete work for E2E configurations.
  - In-project cypress configuration is included
  - In-project robotframework is installed, but not configured
  - External E2E projects feature is not included.
