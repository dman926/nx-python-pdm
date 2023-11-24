import { execSync } from 'child_process';
import chalk from 'chalk';
import { getPackageManagerCommand } from '@nx/devkit';

const { exec } = getPackageManagerCommand();

// Ran with `${exec} ${script}`
const pnpmScripts = [
  'nx format:check',
  'nx affected -t lint',
  'nx affected -t test --coverage',
  'nx affected -t build',
  'nx affected -t e2e --coverage',
].map((script) => `${exec} ${script}`);

// Ran directly
const scripts = [];

const failed = [];

pnpmScripts.concat(scripts).forEach((script) => {
  try {
    console.log(chalk.bold.underline(`Running: \`${script}\``));
    execSync(script);
    console.log(chalk.bold.green(`\`${script}\` succeeded.`));
    console.log();
  } catch (error) {
    console.error(chalk.bold.red(`\`${script}\` failed.`));
    console.log();
    failed.push(script);
  }
});

if (failed.length) {
  const heavyMultiplication = '\u274C';
  console.log(
    chalk.bold.bgBlack(
      `${heavyMultiplication} ${chalk.underline(
        `${failed.length > 1 ? 'Checks' : 'A check'} failed!`
      )}`
    )
  );
  console.log(chalk.bold.red(failed.join('\n')));
} else {
  const heavyCheckMark = '\u2714';
  console.log(chalk.bold.bgGreenBright(`${heavyCheckMark} All checks pass!`));
}

console.log();
