import { execSync } from 'child_process';
import chalk from 'chalk';
import devkit from '@nx/devkit';
const { getPackageManagerCommand } = devkit;

const exec = getPackageManagerCommand().exec;

// Ran with `${exec} ${script}`
const pnpmScripts = [
  'nx format:check',
  'nx affected -t=lint',
  'nx affected -t=test',
  'nx affected -t=build',
  'nx affected -t=e2e',
].map((script) => `${exec} ${script}`);

// Ran directly
const scripts = [];

const passed = pnpmScripts.concat(scripts).every((script) => {
  try {
    console.log(chalk.bold.underline(`Running: \`${script}\``));
    execSync(script);
    console.log(chalk.bold.green(`\`${script}\` succeeded.`));
    console.log();
    return true;
  } catch (error) {
    console.error(chalk.bold.red(`\`${script}\` failed.`));
    console.log();
    return false;
  }
});

if (passed) {
  console.log(chalk.bold.bgGreenBright('All checks pass!'));
} else {
  console.log(chalk.bold.bgRedBright('A check failed!'));
}

console.log();
