# Testing the Unsplash MCP Server

This document provides information about the test suite and how to run various types of tests.

## Available Test Scripts

The package includes several testing scripts for different scenarios:

- `npm test` - Runs the core unit and integration tests
- `npm run test:manual` - Runs a manual test for the stock_photo tool
- `npm run test:docker` - Tests the server in a Docker container
- `npm run test:smithery` - Tests Smithery.ai compatibility
- `npm run test:all` - Runs all tests and provides a summary report

## Comprehensive Test Suite

The `test:all` script runs all available tests and categorizes them as:

- **Passed** - Tests that completed successfully
- **Failed** - Tests that encountered errors that need to be fixed
- **Skipped/Known Issues** - Tests that were skipped due to environment limitations or known issues

### Common Skip Scenarios

- **Docker not available** - Docker tests are skipped if Docker is not installed
- **Docker daemon not running** - Docker tests are skipped if the Docker daemon is not running
- **Server not built** - Built server tests are skipped if the server has not been built (`npm run build`)
- **Stdio limitations** - Some tests using stdio protocol may time out due to known limitations in the testing environment

## Running Tests with an API Key

All tests require an Unsplash API key. You can provide this in several ways:

1. Set the `UNSPLASH_ACCESS_KEY` environment variable:

   ```bash
   export UNSPLASH_ACCESS_KEY=your_unsplash_api_key_here
   npm run test:all
   ```

2. Create a `.env` file in the project root:

   ```
   UNSPLASH_ACCESS_KEY=your_unsplash_api_key_here
   ```

3. Run tests with the environment variable inline:

   ```bash
   UNSPLASH_ACCESS_KEY=your_unsplash_api_key_here npm run test:all
   ```

Note: In test environments without an API key, a test key is provided automatically, but this key is for testing only and has limited API usage.

## Writing New Tests

When adding new tests, follow these guidelines:

1. Unit tests should go in `src/__tests__/unit/`
2. Integration tests should go in `src/__tests__/integration/`
3. Manual/CLI tests should go in `tests/`
4. Docker-related tests should go in `tests/docker/`

## Troubleshooting Test Issues

- **API Key Errors**: Make sure your Unsplash API key is properly set
- **Docker Issues**: Ensure Docker is installed and running if you want to run container tests
- **Build Issues**: Run `npm run build` before testing the built server
- **Timeout Issues**: Some tests have timeouts that may need adjustment in slower environments 