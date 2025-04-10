#!/bin/bash

# Create a pipe for communication
rm -f /tmp/mcp_pipe_in /tmp/mcp_pipe_out
mkfifo /tmp/mcp_pipe_in /tmp/mcp_pipe_out

# Start the server with the pipes as stdin/stdout
(UNSPLASH_ACCESS_KEY=Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0 NODE_ENV=production node dist/server.js < /tmp/mcp_pipe_in > /tmp/mcp_pipe_out) &

# Store the server PID
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait a moment for the server to initialize
sleep 1

# Prepare a ping request
PING_REQUEST='{"jsonrpc":"2.0","id":1,"method":"ping"}'
echo "Sending ping request: $PING_REQUEST"

# Send the ping request to the server
echo $PING_REQUEST > /tmp/mcp_pipe_in

# Wait for a response with a timeout
echo "Waiting for response..."
read -t 5 RESPONSE < /tmp/mcp_pipe_out

# Check if we got a response
if [ -n "$RESPONSE" ]; then
    echo "Received response: $RESPONSE"
else
    echo "No response received within timeout"
fi

# Clean up
kill $SERVER_PID
rm -f /tmp/mcp_pipe_in /tmp/mcp_pipe_out 