// Ardhnarishwar AI SaaS Platform - Universal Single-Command Runner
// Launches both Backend (Port 5000) and Frontend (Port 5173) simultaneously

const { spawn, exec } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('\x1b[35m%s\x1b[0m', '=============================================================');
console.log('\x1b[36m%s\x1b[0m', '   ARDHNARISHWAR AI-POWERED INTERVIEW SAAS PLATFORM');
console.log('\x1b[33m%s\x1b[0m', '   Starting Backend (5000) & Frontend (5173)...');
console.log('\x1b[35m%s\x1b[0m', '=============================================================\n');

// 1. Spawn Backend Server
const backend = spawn('node', ['server.js'], {
  cwd: backendDir,
  shell: true,
  stdio: 'pipe'
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[BACKEND 5000]\x1b[0m ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[BACKEND ERR]\x1b[0m ${data}`);
});

// 2. Spawn Frontend Dev Server
const frontend = spawn('npm', ['run', 'dev', '--', '--host'], {
  cwd: frontendDir,
  shell: true,
  stdio: 'pipe'
});

let openedBrowser = false;

frontend.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(`\x1b[36m[FRONTEND 5173]\x1b[0m ${str}`);

  // Automatically open browser on first ready signal
  if (!openedBrowser && (str.includes('localhost:5173') || str.includes('ready in'))) {
    openedBrowser = true;
    console.log('\n\x1b[32m%s\x1b[0m', '>>> Platform Ready! Opening http://localhost:5173 in browser... <<<\n');
    
    // Open URL in default browser based on OS
    const openCmd = process.platform === 'win32'
      ? 'start http://localhost:5173/'
      : process.platform === 'darwin'
      ? 'open http://localhost:5173/'
      : 'xdg-open http://localhost:5173/';
      
    exec(openCmd);
  }
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[FRONTEND INFO]\x1b[0m ${data}`);
});

// Handle graceful termination
function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down Ardhnarishwar platform servers...');
  try {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${backend.pid} /T /F`);
      exec(`taskkill /pid ${frontend.pid} /T /F`);
    } else {
      backend.kill();
      frontend.kill();
    }
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
