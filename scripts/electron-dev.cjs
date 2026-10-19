#!/usr/bin/env node
const { spawn } = require('child_process');

// On headless Linux / Cloud Run container (no DISPLAY), run web game server on port 3000
if (process.platform === 'linux' && !process.env.DISPLAY) {
  console.log('⚡ Headless environment: Starting game server on port 3000...');
  const child = spawn('npx', ['tsx', 'server.ts'], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  // When running on desktop (Windows, macOS, or Linux with X11)
  try {
    const electron = require('electron');
    const child = spawn(electron, ['.'], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code || 0));
  } catch (err) {
    console.log('Starting game dev server...');
    const child = spawn('npx', ['tsx', 'server.ts'], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code || 0));
  }
}
