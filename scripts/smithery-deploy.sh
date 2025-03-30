#!/bin/bash

set -e

echo "===== Validating Smithery Deployment ====="

# Check for required files
echo "Checking required files..."
[ -f "Dockerfile" ] || { echo "❌ Dockerfile not found"; exit 1; }
[ -f "smithery.yaml" ] || { echo "❌ smithery.yaml not found"; exit 1; }
echo "✅ Required files found"

# Build Docker image for Smithery deployment
echo "Building Docker image..."
docker build -t unsplash-mcp-smithery .

# Get API key
[ -f ".env" ] || { echo "❌ .env file not found"; exit 1; }
API_KEY=$(grep UNSPLASH_ACCESS_KEY .env | cut -d= -f2)
if [ -z "$API_KEY" ]; then
  echo "❌ UNSPLASH_ACCESS_KEY not found in .env file"
  exit 1
fi

echo "✅ Docker image built successfully"
echo "✅ Deployment files validated"

echo "====================="
echo "The MCP server is ready for Smithery deployment!"
echo "Files:"
echo "- Dockerfile: Ready"
echo "- smithery.yaml: Ready"
echo ""
echo "To deploy on Smithery:"
echo "1. Fill out the form with:"
echo "   ID: @drumnation/unsplash-smart-mcp-server"
echo "   Base Directory: ."
echo "   Local Only: Unchecked (not required)"
echo ""
echo "2. Click Create to proceed with deployment"
echo "=====================" 