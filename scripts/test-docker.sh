#!/bin/bash

set -e

echo "===== Testing Unsplash MCP Docker Deployment ====="

# Build Docker image
echo "Building Docker image..."
docker build -t unsplash-mcp-test .

# Get API key
API_KEY=$(grep UNSPLASH_ACCESS_KEY .env | cut -d= -f2)
if [ -z "$API_KEY" ]; then
  echo "Error: UNSPLASH_ACCESS_KEY not found in .env file"
  exit 1
fi

# Create test files
PING_REQUEST=$(mktemp)
PING_RESPONSE=$(mktemp)
TOOL_REQUEST=$(mktemp)
TOOL_RESPONSE=$(mktemp)

echo '{"jsonrpc": "2.0", "method": "ping", "id": 123}' > $PING_REQUEST
echo '{"jsonrpc": "2.0", "method": "tool/invoke", "id": 456, "params": {"name": "get_attributions", "args": {"format": "json"}}}' > $TOOL_REQUEST

echo "Testing ping..."
cat $PING_REQUEST | docker run --rm -i -e UNSPLASH_ACCESS_KEY=$API_KEY unsplash-mcp-test > $PING_RESPONSE
echo "Ping response:"
cat $PING_RESPONSE

echo -e "\nTesting tool invocation..."
cat $TOOL_REQUEST | docker run --rm -i -e UNSPLASH_ACCESS_KEY=$API_KEY unsplash-mcp-test > $TOOL_RESPONSE
echo "Tool response (first 200 chars):"
head -c 200 $TOOL_RESPONSE
echo "..."

# Verify responses with Python
echo -e "\nVerifying responses with Python..."
python3 -c "
import json, sys
try:
    ping = json.load(open('$PING_RESPONSE'))
    if ping.get('result') == 'pong':
        print('✅ Ping test passed')
    else:
        print('❌ Ping test failed')
        sys.exit(1)
    
    tool = json.load(open('$TOOL_RESPONSE'))
    if 'result' in tool and 'count' in tool['result']:
        print('✅ Tool test passed')
    else:
        print('❌ Tool test failed')
        sys.exit(1)
    
    print('✅ All tests passed - Docker deployment successful!')
except Exception as e:
    print(f'❌ Test failed: {e}')
    sys.exit(1)
"

# Clean up
rm -f $PING_REQUEST $PING_RESPONSE $TOOL_REQUEST $TOOL_RESPONSE
echo "Clean up complete." 