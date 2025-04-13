# Smithery Cloud Deployment Guide

This guide explains how to deploy the Unsplash MCP Server using Smithery's cloud deployment service.

## Prerequisites

1. A Smithery account (sign up at [smithery.ai](https://smithery.ai) if you don't have one)
2. An Unsplash API key (get one from [unsplash.com/developers](https://unsplash.com/developers))
3. Cursor IDE installed

## Installation

### Using Smithery CLI

Install the server in Cursor via Smithery CLI:

```bash
# Install Smithery CLI if you don't have it
npm install -g @smithery/cli

# Then install the Unsplash MCP server
npx @smithery/cli install @drumnation/unsplash-smart-mcp-server --client cursor --key your_unsplash_api_key_here
```

### Via Smithery Web Dashboard

1. Log in to [Smithery.ai](https://smithery.ai)
2. Search for "@drumnation/unsplash-smart-mcp-server"
3. Click "Install"
4. Select "Cursor" as the client
5. Enter your Unsplash API key
6. Follow the prompts to complete installation

## Troubleshooting

If you encounter the error "No connection configuration found":

1. **Verify your API key**: Make sure you're using a valid Unsplash API key
2. **Check for updates**: Ensure you have the latest version of the Smithery CLI:
   ```bash
   npm update -g @smithery/cli
   ```
3. **Manual configuration**: If cloud deployment fails, use the local installation method described in the main README.md

## Windows-Specific Notes

When using Smithery on Windows, the cloud deployment automatically includes special handling for Windows process management to avoid the "Client closed" issue.

## Updating

To update to the latest version:

```bash
npx @smithery/cli update @drumnation/unsplash-smart-mcp-server
```

## Uninstalling

To remove the server:

```bash
npx @smithery/cli uninstall @drumnation/unsplash-smart-mcp-server
``` 