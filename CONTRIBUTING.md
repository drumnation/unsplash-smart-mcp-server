# Contributing to Unsplash Smart MCP Server

Thank you for your interest in contributing to the Unsplash Smart MCP Server! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/unsplash-smart-mcp-server.git
   cd unsplash-smart-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your Unsplash API key to the `.env` file

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## Code Standards

We follow functional programming principles:

### Functional Programming
- **DRY**: Avoid code duplication
- **KISS**: Keep code simple and focused
- **YAGNI**: Implement only essential features

### SOLID for FP
- **Single Responsibility**: One task per function
- **Open/Closed**: Extend through composition
- **Liskov Substitution**: Handle valid inputs consistently
- **Interface Segregation**: Minimal input requirements
- **Dependency Inversion**: Use higher-order functions

### Modular Design
- Pure, testable functions
- Function composition
- Separate side effects
- Immutable data handling

### Clean Code
- Descriptive naming
- Logical organization
- Prefer functional methods
- Minimize dependencies
- Self-documenting code

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code standards above
   - Add or update tests as necessary
   - Update documentation to reflect your changes

3. **Run tests and linting**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   - Use conventional commit messages (e.g., "feat: add new feature", "fix: resolve Windows issue")
   - Reference issue numbers in commit messages when applicable

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Create a pull request from your fork to the main repository
   - Describe your changes in detail
   - Reference any related issues

## Reporting Bugs

When reporting bugs, please include:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots or error logs if applicable
6. Environment details (OS, Node.js version, etc.)

## Feature Requests

Feature requests are welcome! Please provide:

1. A clear description of the feature
2. The motivation behind the feature
3. How the feature would be used
4. Any alternatives you've considered

## Cross-Platform Compatibility

When contributing code that affects how the server is launched or interacts with the operating system:

1. Test on multiple platforms when possible (Windows, macOS, Linux)
2. Document platform-specific behaviors or requirements
3. Implement platform detection for features that require different handling

## Code Review Process

All submissions require review before being merged:

1. A maintainer will review your pull request
2. Automated tests must pass
3. Feedback may be provided for necessary changes
4. Once approved, a maintainer will merge your changes

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.

Thank you for your contributions! 