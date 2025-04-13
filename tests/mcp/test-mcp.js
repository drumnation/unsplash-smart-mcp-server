#!/usr/bin/env node

// Test script to verify MCP server functionality
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting server process...');

// Use npm run dev instead
const server = spawn('npm', ['run', 'dev'], 
  {
    env: {
      ...process.env,
      UNSPLASH_ACCESS_KEY: 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0',
      NODE_ENV: 'test'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  }
);

// Wait for server to start up
let serverStarted = false;

server.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(`Server stderr: ${output}`);
  
  // Check if server is ready
  if (output.includes('MCP Server started') || output.includes('listening')) {
    serverStarted = true;
    sendPingRequest();
  }
});

// Test MCP request
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'ping',
  params: {}
};

function sendPingRequest() {
  console.log('Sending test request to server...');
  server.stdin.write(JSON.stringify(testRequest) + '\n');
}

// Listen for response
let output = '';
server.stdout.on('data', (data) => {
  const chunk = data.toString();
  console.log(`Server stdout: ${chunk}`);
  output += chunk;
  
  if (output.includes('"result"')) {
    console.log('Server responded successfully:');
    console.log(output);
    server.kill();
    process.exit(0);
  }
});

// Handle errors
server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Send request after 5 seconds if server hasn't indicated readiness
setTimeout(() => {
  if (!serverStarted) {
    console.log('No server ready message detected, sending request anyway...');
    sendPingRequest();
  }
}, 5000);

// Timeout after 15 seconds
setTimeout(() => {
  console.error('Timed out waiting for server response');
  server.kill();
  process.exit(1);
}, 15000); 