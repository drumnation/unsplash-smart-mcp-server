# Changelog

## 1.0.1 (2025-04-13)

### Fixed
- Fixed Windows compatibility issue where the server would terminate immediately with "Client closed" error when using the recommended `cmd /c npx` configuration
- Added Windows-specific MCP configurations using direct Node execution and PowerShell approaches
- Fixed Smithery cloud deployment by adding proper cursor-specific connection configuration
- Added special Windows platform detection and handling in Smithery configuration

### Added
- Comprehensive Windows compatibility documentation in `docs/windows-compatibility.md`
- Detailed Smithery deployment instructions in `docs/smithery-deployment.md`
- Updated README.md with Windows compatibility section and references to new guides

## 1.0.0 (2025-04-01)

### Added
- Initial release of the Unsplash Smart MCP Server
- Support for searching and downloading professional stock photos from Unsplash
- Intelligent context awareness for better image selection
- Automated attribution management
- Support for various project types and directory structures 