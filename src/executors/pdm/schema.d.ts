export interface pdmExecutorSchema {
  // The command to run. 'pdm ' is prepended to this command.
  command: string;
  // Override where the command runs. By default, the command runs in the project root.
  cwd?: string;
  // Do not prepend 'pdm ' to the given command.
  raw?: boolean;
}
