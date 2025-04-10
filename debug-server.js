#!/usr/bin/env node

// Debug script for monitoring the unsplash-mcp server
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Unsplash MCP server in debug mode...');

// Start the server with all output captured
const server = spawn('node', ['dist/server.js'], {
  env: {
    ...process.env,
    UNSPLASH_ACCESS_KEY: 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0',
    NODE_ENV: 'debug',
    DEBUG: '*',
    MCP_DEBUG: 'true',
    FASTMCP_DEBUG: 'true'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

console.log(`Server started with PID: ${server.pid}`);

// Log all stdout output
server.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`[STDOUT] ${output}`);
});

// Log all stderr output
server.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`[STDERR] ${output}`);
});

// Monitor server termination
server.on('close', (code) => {
  console.log(`Server process exited with code: ${code}`);
});

// Monitor errors
server.on('error', (error) => {
  console.error(`Server error: ${error.message}`);
});

// Send a ping request after a delay
setTimeout(() => {
  console.log('Sending ping request...');
  const pingRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'ping'
  };
  try {
    server.stdin.write(JSON.stringify(pingRequest) + '\n');
    console.log('Ping request sent successfully');
  } catch (error) {
    console.error(`Error sending ping request: ${error.message}`);
  }
}, 2000);

// Timeout to terminate the process after a while
setTimeout(() => {
  console.log('Debug session timeout reached, terminating...');
  server.kill();
  process.exit(0);
}, 10000); 