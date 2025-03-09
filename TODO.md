# Swagger MCP - TODO List

## Current Tasks

- 🟥 Fix OpenAPI version compatibility tests - failing on all versions (2.0, 3.0, 3.1)
- 🟥 Fix endpoint path issues in projects-api-v3.oas2.yml for authentication and file operations tests
- 🟥 Fix schema validation failures for parameters property
- 🟥 Fix format-suffix-mock test extraction failure
- 🟨 Add support for authentication in generated tool handlers
- 🟨 Improve error handling in generated tool handlers
- 🟨 Add support for file uploads and downloads
- 🟨 Create a web UI for testing generated tool definitions
- 🟨 Add support for generating complete MCP servers from Swagger definitions

## Completed Tasks

- ✅ Fix tests to use projects-api-v3.oas2.yml instead of mock-swagger.json
- ✅ Create examples for different Swagger API types (OpenAPI 2.0, 3.0, etc.)
- ✅ Add unit tests for the improved generator
- ✅ Add validation for complex endpoint structures like Create Task
- ✅ Implement validation for generated tool definitions against MCP schema
- ✅ Fix the generateEndpointToolCode method to properly handle json.Unmarshaler interfaces in OpenAPI definitions
- ✅ Implement improved MCP tool code generator with full schema information
- ✅ Add support for YAML Swagger files
- ✅ Improve parameter naming to avoid problematic characters
- ✅ Generate more semantic tool names
- ✅ Include comprehensive documentation in generated tool definitions
- ✅ Make generated code self-contained without external dependencies
- ✅ Update README.md with documentation for the improved generator
- ✅ Add AI-specific instructions in tool descriptions
