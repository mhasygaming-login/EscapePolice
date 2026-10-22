#!/usr/bin/env node
const { spawnSync } = require('child_process');

console.log('📦 Step 1: Building Escape Police web and server assets for desktop...');
const env = { ...process.env, ELECTRON_BUILD: 'true' };

const webBuild = spawnSync('npx', ['vite', 'build'], { stdio: 'inherit', env });
if (webBuild.status !== 0) {
  process.exit(webBuild.status || 1);
}

const serverBuild = spawnSync(
  'npx',
  [
    'esbuild',
    'server.ts',
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--packages=external',
    '--sourcemap',
    '--outfile=dist/server.cjs',
  ],
  { stdio: 'inherit', env }
);
if (serverBuild.status !== 0) {
  process.exit(serverBuild.status || 1);
}

console.log('📦 Step 2: Packaging for Windows NSIS (.exe)...');
// When running on Windows or if real electron-builder is available with Wine/Windows support
if (process.platform === 'win32' || process.env.RUN_REAL_BUILDER) {
  const eb = spawnSync('npx', ['electron-builder', '--win', 'nsis', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env,
  });
  process.exit(eb.status || 0);
} else {
  console.log('✅ Web bundle & server runtime compiled successfully in dist/ with relative paths for electron-builder.');
  console.log('✅ Windows NSIS installer configured in package.json.');
  console.log('💡 To package into .exe on Windows, simply run: npm run electron:build');
  process.exit(0);
}
