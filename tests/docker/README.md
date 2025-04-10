# Docker Tests and Configuration

## Running Tests

```bash
# Basic Docker functionality test
npm run test:docker

# Docker container uptime test
npm run test:docker:uptime

# Running Smithery integration tests
npm run test:smithery
```

## Docker Best Practices

### Server Persistence

For reliable operation in Docker environments, the server should be started using `npm start` rather than directly executing the TypeScript file with tsx. This ensures that:

1. The compiled JavaScript is executed instead of interpreting TypeScript on-the-fly
2. The server process remains running and doesn't exit prematurely
3. Node.js properly handles the process lifecycle for long-running services

The Dockerfile should use this configuration:

```dockerfile
# Command to run the server - use npm start instead of direct tsx execution
CMD ["npm", "start"]
```

Instead of this approach which can cause stability issues:

```dockerfile
# Not recommended for production
CMD ["tsx", "src/server.ts"]
```

### Verifying Container Uptime

You can verify that the Docker container stays running with:

```bash
# Build and run the Docker container
npm run test:docker:uptime
```

This test verifies that the container remains running for at least 45 seconds, checking at 5, 15, and 45 second intervals.
