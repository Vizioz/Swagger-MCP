# Swagger MCP - TODO List

## Current Tasks

- 🟥 Fix the generateEndpointToolCode method, it is currently generating the wrong structure when there are json.Unmarshaler interfaces exposed in the OpenAPI definition.
  
    When processing OpenAPI specifications, pay special attention to custom type definitions that implement json.Unmarshaler interfaces. These are often used for specialized data formats like dates, times, and other custom serialization needs.

    ### Key Requirements

  1. **Identify Custom Unmarshalers**: Look for object definitions in the OpenAPI spec that:
      - Have names suggesting data type handling (e.g., "Date", "DateTime", "Time", "Duration")
      - Include descriptions mentioning "unmarshals" or specific format handling
      - Are defined as objects but represent primitive values with formatting rules

  2. **Format Guidance Instead of Nesting**: 
     - DO NOT include these as nested elements with a "Value" property
     - INSTEAD, use the appropriate primitive type in your MCP definition
     - Add clear formatting guidance in the description field

- 🟨 Add unit tests for the improved generator
- 🟨 Create examples for different Swagger API types (OpenAPI 2.0, 3.0, etc.)
- 🟨 Implement validation for generated tool definitions against MCP schema
- 🟨 Add support for authentication in generated tool handlers
- 🟨 Improve error handling in generated tool handlers
- 🟨 Add support for file uploads and downloads
- 🟨 Create a web UI for testing generated tool definitions
- 🟨 Add support for generating complete MCP servers from Swagger definitions

## Completed Tasks

- ✅ Implement improved MCP tool code generator with full schema information
- ✅ Add support for YAML Swagger files
- ✅ Improve parameter naming to avoid problematic characters
- ✅ Generate more semantic tool names
- ✅ Include comprehensive documentation in generated tool definitions
- ✅ Make generated code self-contained without external dependencies
- ✅ Update README.md with documentation for the improved generator
- ✅ Add AI-specific instructions in tool descriptions 