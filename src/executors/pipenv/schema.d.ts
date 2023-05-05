export interface PipenvExecutorSchema {
  // The command to run. 'pipenv ' is prepended to this command.
  command: string;
  // Override where the command runs. By default, the command runs in the project root.
  cwd?: string;
  // Do not prepend 'pipenv ' to the given command.
  raw?: boolean;
}
