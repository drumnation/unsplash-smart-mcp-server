#!/usr/bin/env node

// Test the FastMCP server directly using its API without stdin/stdout
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import the FastMCP server directly
import '../src/server.js';

// Set test mode environment variable
process.env.NODE_ENV = 'test';
process.env.UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0';

// Wait for server initialization, then make a request
console.log('Testing FastMCP API directly...');
console.log('Using API key:', process.env.UNSPLASH_ACCESS_KEY);

// Test function to check if the server works
async function testServerFunctionality() {
  try {
    // Import fastmcp SDK
    const { Client } = await import('@modelcontextprotocol/sdk');
    
    // Create a virtual stdio transport for testing
    const virtualStdioTransport = {
      onmessage: null,
      send: (message) => {
        console.log('⬅️ Received from server:', message);
        
        try {
          const response = JSON.parse(message);
          if (response.result === 'pong') {
            console.log('✅ Server ping test successful!');
            process.exit(0);
          } else if (response.result) {
            console.log('✅ Server response successful!');
            console.log('Response preview:', JSON.stringify(response).slice(0, 200) + '...');
            process.exit(0);
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
      },
      close: () => {
        console.log('Connection closed');
      }
    };
    
    // Create a client to communicate with the server
    const client = new Client({ transport: virtualStdioTransport });
    
    // Test ping
    console.log('Sending ping request...');
    await client.ping();
    
    // If we get here, the test failed because the send method didn't exit
    console.error('❌ Test failed: did not receive ping response');
    process.exit(1);
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Give the server time to start
setTimeout(testServerFunctionality, 2000);

// Set a timeout in case the test never completes
setTimeout(() => {
  console.error('❌ Test timed out after 10 seconds');
  process.exit(1);
}, 10000); 