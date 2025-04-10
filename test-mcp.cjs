#!/usr/bin/env node

// Test script to verify MCP server functionality
const { spawn } = require('child_process');
const path = require('path');

// Use npm executable instead of hardcoded path
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const server = spawn(npxCmd, ['tsx', path.join(__dirname, 'src/server.ts')], 
  {
    env: {
      ...process.env,
      UNSPLASH_ACCESS_KEY: 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0',
      NODE_ENV: 'test'
    }
  }
);

// Test MCP request
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'ping',
  params: {}
};

console.log('Sending test request to server...');
server.stdin.write(JSON.stringify(testRequest) + '\n');

// Listen for response
let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('Raw output:', data.toString());
  if (output.includes('"result"')) {
    console.log('Server responded successfully:');
    console.log(output);
    server.kill();
    process.exit(0);
  }
});

// Handle errors
server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error('Timed out waiting for server response');
  server.kill();
  process.exit(1);
}, 5000); 