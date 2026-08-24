import { spawn } from 'node:child_process';

const child = spawn(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'start'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      HOST: process.env.HOST || '0.0.0.0',
      PORT: process.env.PORT || '3000',
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));