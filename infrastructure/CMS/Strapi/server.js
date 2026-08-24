const { spawn } = require('node:child_process');
const path = require('node:path');

const strapiBin = path.join(
  __dirname,
  'node_modules',
  '@strapi',
  'strapi',
  'bin',
  'strapi.js',
);

const child = spawn(
  process.execPath,
  [strapiBin, 'start'],
  {
    stdio: 'inherit',
    env: process.env,
  },
);

const shutdown = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});