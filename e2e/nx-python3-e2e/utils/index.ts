import { getPackageManagerCommand } from '@nrwl/devkit';
import { execSync } from 'child_process';

const KILL_PORT_DELAY = 5000;
const E2E_LOG_PREFIX = ' E2E ';

function e2eConsoleLogger(message: string, body?: string) {
  process.stdout.write('\n');
  process.stdout.write(`${E2E_LOG_PREFIX} ${message}\n`);
  if (body) {
    process.stdout.write(`${body}\n`);
  }
  process.stdout.write('\n');
}

export function logInfo(title: string, body?: string) {
  const message = ` INFO ${title}`;
  return e2eConsoleLogger(message, body);
}

export function logError(title: string, body?: string) {
  const message = ` ERROR ${title}`;
  return e2eConsoleLogger(message, body);
}

export function logSuccess(title: string, body?: string) {
  const message = ` SUCCESS ${title}`;
  return e2eConsoleLogger(message, body);
}

export function packageInstall(pkg: string) {
  return execSync(`${getPackageManagerCommand().addDev} ${pkg}`).toString();
}

export function packageUninstall(pkg: string) {
  return execSync(`${getPackageManagerCommand().rm} ${pkg}`).toString();
}
