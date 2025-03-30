#!/usr/bin/env node

// This script reads stdin and writes appropriate responses to stdout
// to handle the ping messages that Cursor sends.

// Listen for data from stdin
process.stdin.on('data', data => {
  try {
    const input = data.toString().trim();
    
    // Log to stderr for debugging (won't interfere with JSON-RPC)
    console.error(`Received: ${input}`);
    
    // Check if it's a ping message
    if (input.includes('"method":"ping"')) {
      const jsonData = JSON.parse(input);
      
      // Respond to ping with a pong
      const response = {
        jsonrpc: '2.0',
        id: jsonData.id,
        result: {}
      };
      
      // Send the response
      console.log(JSON.stringify(response));
    }
    else if (input.includes('"method":"server/info"')) {
      const jsonData = JSON.parse(input);
      
      // Respond with server info
      const response = {
        jsonrpc: '2.0',
        id: jsonData.id,
        result: {
          name: 'Unsplash MCP Server',
          version: '1.0.0',
          tools: [
            {
              name: 'unsplashSearchPhotos',
              description: 'Search for photos on Unsplash by keyword'
            },
            {
              name: 'unsplashDownloadPhotoById',
              description: 'Download a photo from Unsplash by its ID'
            }
          ]
        }
      };
      
      // Send the response
      console.log(JSON.stringify(response));
    }
  } catch (error) {
    console.error(`Error processing input: ${error}`);
  }
});

console.error('Ping responder started, waiting for input...'); 