#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Starting built server...');

// Run the built server
const server = spawn('node', [path.join(rootDir, 'dist/server.js')], 
  {
    env: {
      ...process.env,
      UNSPLASH_ACCESS_KEY: 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0',
      NODE_ENV: 'test'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  }
);

// Test MCP request
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'ping'
};

// Give the server a moment to start
setTimeout(() => {
  console.log('Sending ping request...');
  server.stdin.write(JSON.stringify(testRequest) + '\n');
}, 1000);

// Listen for response
server.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`Server response: ${output}`);
  
  try {
    const response = JSON.parse(output);
    if (response.result === 'pong') {
      console.log('✅ Server ping test successful!');
      server.kill();
      process.exit(0);
    }
  } catch (e) {
    // Not JSON or error parsing
  }
});

// Handle errors
server.stderr.on('data', (data) => {
  console.error(`Server error: ${data.toString()}`);
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
