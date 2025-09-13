// Simple script to start the API server
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting API server...');

const apiProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'api'),
  stdio: 'inherit',
  shell: true
});

apiProcess.on('error', (error) => {
  console.error('Failed to start API server:', error);
});

apiProcess.on('close', (code) => {
  console.log(`API server process exited with code ${code}`);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('Stopping API server...');
  apiProcess.kill('SIGINT');
});
