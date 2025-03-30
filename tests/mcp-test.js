#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the server script
const serverPath = path.join(__dirname, 'src', 'server.ts');

// Prepare server process
const serverProcess = spawn('tsx', [serverPath], {
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Set up timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('Test timed out');
  serverProcess.kill();
  process.exit(1);
}, 30000);

// Handle server output
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[Server STDOUT]: ${output.trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(`[Server STDERR]: ${output.trim()}`);
  
  // Check if server is ready
  if (output.includes('Unsplash MCP Server started')) {
    console.log('\nServer is ready, sending test request...');
    
    // Send a simple JSON-RPC request for server info
    const request = {
      jsonrpc: '2.0',
      method: 'server/info',
      id: 1
    };
    
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  }
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  clearTimeout(timeout);
  process.exit(code);
});

// Handle stdin data from the server
serverProcess.stdin.on('data', (data) => {
  console.log(`[Received from server]: ${data.toString().trim()}`);
});

// Exit cleanly on interruptions
process.on('SIGINT', () => {
  console.log('Terminating test...');
  serverProcess.kill();
  clearTimeout(timeout);
  process.exit(0);
}); 