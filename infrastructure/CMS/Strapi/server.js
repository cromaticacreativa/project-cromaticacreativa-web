const { spawn } = require('node:child_process');

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['strapi', 'start'],
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