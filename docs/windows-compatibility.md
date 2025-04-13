# Windows Compatibility Guide for Unsplash MCP Server

This guide addresses the "Client closed" issue when running the Unsplash MCP server in Cursor on Windows.

## Problem

When using the standard `cmd /c npx` configuration on Windows, the MCP server may terminate immediately with a "Client closed" error. This happens because:

1. The Windows `cmd /c` terminates after launching the child process
2. Cursor's MCP process management may misinterpret this as the entire server closing
3. STDIO buffering on Windows is handled differently than on Unix-like systems

## Solution: Direct Node Execution

Instead of using cmd or npx directly, use one of these alternative configurations:

### Option 1: Direct Node Execution (Recommended)

Create an MCP configuration file with these settings:

```json
{
  "mcpServers": {
    "stock_photo": {
      "command": "node",
      "args": ["./node_modules/.bin/tsx", "src/server.ts"],
      "disabled": false,
      "env": {
        "UNSPLASH_ACCESS_KEY": "your_api_key_here"
      },
      "shell": false
    }
  }
}
```

This approach:
- Avoids cmd shell termination issues
- Uses direct paths to binaries in node_modules
- Disables shell to prevent Windows-specific shell behaviors

### Option 2: PowerShell Approach

For PowerShell users:

```json
{
  "mcpServers": {
    "stock_photo": {
      "command": "powershell",
      "args": ["-Command", "npx tsx src/server.ts"],
      "disabled": false,
      "env": {
        "UNSPLASH_ACCESS_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Installation Steps

1. Create a file named `mcp.json` in your `.cursor` directory in your user home folder
2. Copy one of the above configurations
3. Replace `your_api_key_here` with your actual Unsplash API key
4. Restart Cursor
5. Open the MCP panel and click the refresh button

## Troubleshooting

If you still encounter issues:

1. Verify your API key is correct
2. Try running the server manually to confirm it works: `npx tsx src/server.ts`
3. Check Cursor logs for detailed error messages
4. Make sure all paths in your configuration are correct

For additional help, please [open an issue](https://github.com/drumnation/unsplash-smart-mcp-server/issues) on GitHub. 