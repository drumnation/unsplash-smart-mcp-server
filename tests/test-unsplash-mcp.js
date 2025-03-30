#!/usr/bin/env node

// Simple test script for the Unsplash MCP server
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Path to the server script
const serverPath = path.join(__dirname, 'src', 'server.ts');

// Get API key from environment
const apiKey = process.env.UNSPLASH_ACCESS_KEY;
if (!apiKey || apiKey === 'your_key_here') {
  console.error('Error: Please set the UNSPLASH_ACCESS_KEY environment variable to a valid Unsplash API key');
  process.exit(1);
}

console.log('Starting Unsplash MCP server...');

// Start the server as a child process
const server = spawn('tsx', [serverPath], {
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
let serverReady = false;
server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`Server stdout: ${output.trim()}`);
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(`Server stderr: ${output.trim()}`);
  
  // Check for server ready in stderr now
  if (!serverReady && output.includes('Unsplash MCP Server started')) {
    serverReady = true;
    console.log('Server is ready! Testing some features:');
    
    // Small delay to ensure the server is fully initialized
    setTimeout(() => {
      testServerFeatures();
    }, 1000);
  }
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Test server features
async function testServerFeatures() {
  console.log('\nTesting photo search...');
  try {
    // Simulate a request to the server
    const response = await fetch('http://127.0.0.1:3000/search-photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'mountains',
        page: 1,
        perPage: 3
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Found ${data.total} photos. Showing ${data.photos.length} results:`);
      
      for (const photo of data.photos) {
        console.log(`- ${photo.description || 'No description'} (ID: ${photo.id})`);
        console.log(`  By: ${photo.photographer_name}`);
        console.log(`  Preview URL: ${photo.preview_url}`);
        console.log();
      }

      // Download the first photo
      if (data.photos.length > 0) {
        const photoId = data.photos[0].id;
        await downloadPhoto(photoId);
      }
    } else {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(errorText);
    }
  } catch (error) {
    console.error('Error testing server:', error);
  } finally {
    // Clean up
    console.log('\nTest complete. Shutting down server...');
    server.kill();
  }
}

async function downloadPhoto(photoId) {
  console.log(`\nDownloading photo with ID: ${photoId}...`);
  try {
    const response = await fetch('http://127.0.0.1:3000/download-photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoId,
        downloadDirectory: './downloads'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Photo downloaded to: ${data.filepath}`);
      console.log(`Attribution: ${data.message}`);
    } else {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(errorText);
    }
  } catch (error) {
    console.error('Error downloading photo:', error);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Shutting down...');
  server.kill();
  process.exit(0);
}); 