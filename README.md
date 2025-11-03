# Swagger MCP

An MCP server that connects to a Swagger specification and helps an AI to build all the required models to generate a MCP server for that service.

## Features

- Downloads a Swagger specification and stores it locally for faster reference.
- Returns a list of all the endpoints and their HTTP Methods and descriptions
- Returns a list of all the models
- Returns a model
- Returns service to connect to the end point
- Returns MCP function definitions
- Generates complete MCP tool definitions with full schema information
- Includes AI-specific instructions in tool descriptions

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:

```
git clone https://github.com/readingdancer/swagger-mcp.git
cd swagger-mcp
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file based on the `.env.example` file:

```
cp .env.example .env
```

4. Update the `.env` file.

## Configuration

Edit the `.env` file to configure the application:

- `PORT`: The port on which the server will run (default: 3000)
- `NODE_ENV`: The environment (development, production, test)
- `LOG_LEVEL`: Logging level (info, error, debug)

## Usage

### Building the application

Build the application:

```
npm run build
```

This will compile the TypeScript code ready to be used as an MCP Server

### Running as an MCP Server

To run as an MCP server for integration with Cursor and other applications:

```
node build/index.js
```

You can also provide a Swagger URL via CLI argument:

```
node build/index.js --swagger-url="https://petstore.swagger.io/v2/swagger.json"
```

Or using the alternative format:

```
node build/index.js --swaggerUrl="https://petstore.swagger.io/v2/swagger.json"
```

**Note**: The CLI `--swagger-url` argument takes priority over the `swaggerFilePath` parameter in tool calls. If both are provided, the CLI argument will be used.

### Using the MCP Inspector

To run the MCP inspector for debugging:

```
npm run inspector
```

### Adding to Cursor

To add this MCP server to Cursor:

1. Open Cursor Settings > Features > MCP
2. Click "+ Add New MCP Server"
3. Enter a name for the server (e.g., "Swagger MCP")
4. Select "stdio" as the transport type
5. Enter the command to run the server:
   - Basic: `node path/to/swagger-mcp/build/index.js`
   - With Swagger URL: `node path/to/swagger-mcp/build/index.js --swagger-url="https://your-api-url/swagger.json"`
6. Click "Add"

The Swagger MCP tools will now be available to the Cursor Agent in Composer.

**Tip**: If you provide the `--swagger-url` CLI argument when configuring the server, you won't need to provide `swaggerFilePath` in tool calls, making the tools easier to use.

### Available Swagger MCP Tools

The following tools are available through the MCP server:

- `getSwaggerDefinition`: Downloads a Swagger definition from a URL
- `listEndpoints`: Lists all endpoints from the Swagger definition (optional `swaggerFilePath`)
- `listEndpointModels`: Lists all models used by a specific endpoint (optional `swaggerFilePath`)
- `generateModelCode`: Generates TypeScript code for a model (optional `swaggerFilePath`)
- `generateEndpointToolCode`: Generates TypeScript code for an MCP tool definition (optional `swaggerFilePath`)

**Swagger Definition Priority**: The tools determine which Swagger definition to use based on this priority:
1. CLI `--swagger-url` argument (if provided when starting the server)
2. `swaggerFilePath` parameter (if provided in the tool call)
3. Error if neither is available

If you start the server with `--swagger-url`, you can omit the `swaggerFilePath` parameter in tool calls for convenience.

### Available Swagger MCP Prompts

The server also provides MCP prompts that guide AI assistants through common workflows:

- `add-endpoint`: A step-by-step guide for adding a new endpoint using the Swagger MCP tools

To use a prompt, clients can make a `prompts/get` request with the prompt name and optional arguments:

```json
{
  "method": "prompts/get",
  "params": {
    "name": "add-endpoint",
    "arguments": {
      "swaggerUrl": "https://petstore.swagger.io/v2/swagger.json",
      "endpointPath": "/pets/{id}",
      "httpMethod": "GET"
    }
  }
}
```

The prompt will return a series of messages that guide the AI assistant through the exact process required to add a new endpoint.

## Setting Up Your New Project

There are two ways to set up the Swagger definition for your project:

### Method 1: Using CLI Argument (Recommended)

Start the MCP server with the `--swagger-url` argument:

```
node build/index.js --swagger-url="https://your-api-url/swagger.json"
```

This automatically downloads and caches the Swagger definition. All tools will use this definition, and you won't need to provide `swaggerFilePath` in tool calls.

### Method 2: Using getSwaggerDefinition Tool

Alternatively, you can ask the agent to get the Swagger file using the `getSwaggerDefinition` tool. Make sure you provide the URL for the swagger file, or at least a way to find it. This will download the file and save it locally with a hashed filename. The filename will automatically be added to a `.swagger-mcp` settings file in the root of your current solution.

## Auto generated .swagger-mcp config file

When using the `getSwaggerDefinition` tool (Method 2 above), a `.swagger-mcp` file is automatically created:

```
SWAGGER_FILEPATH = TheFullPathToTheLocallyStoredSwaggerFile
```

This configuration file associates your current project with a specific Swagger API. We may use it to store more details in the future.

Once configured, you can reference the Swagger file path from this config file when calling tools. However, if you use the CLI `--swagger-url` argument (Method 1), this config file is optional as the Swagger definition is automatically loaded.

## Improved MCP Tool Code Generator

The MCP tool code generator has been enhanced to provide more complete and usable tool definitions:

### Key Improvements

1. **Complete Schema Information**: The generator now includes full schema information for all models, including nested objects, directly in the inputSchema.

2. **Better Parameter Naming**: Parameter names are now more semantic and avoid problematic characters like dots (e.g., `taskRequest` instead of `task.Request`).

3. **Semantic Tool Names**: Tool names are now more descriptive and follow consistent naming conventions based on the HTTP method and resource path.

4. **Support for YAML Swagger Files**: The generator now supports both JSON and YAML Swagger definition files.

5. **Improved Documentation**: Generated tool definitions include comprehensive descriptions for all parameters and properties.

6. **No External Dependencies**: The generated code doesn't require importing external model files, making it more self-contained and easier to use.

7. **AI-Specific Instructions**: Tool descriptions now include special instructions for AI agents, helping them understand how to use the tools effectively.

### Example Usage

To generate an MCP tool definition for an endpoint:

```typescript
import generateEndpointToolCode from './services/generateEndpointToolCode.js';

// If server was started with --swagger-url, swaggerFilePath is optional
const toolCode = await generateEndpointToolCode({
  path: '/pets',
  method: 'POST',
  swaggerFilePath: './petstore.json', // Optional if --swagger-url was provided
  singularizeResourceNames: true
});

console.log(toolCode);
```

This will generate a complete MCP tool definition with full schema information for the POST /pets endpoint.

**Note**: If you started the server with `--swagger-url`, you can omit the `swaggerFilePath` parameter:
```typescript
const toolCode = await generateEndpointToolCode({
  path: '/pets',
  method: 'POST',
  singularizeResourceNames: true
});
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## MCP Prompts for AI Assistants

To help AI assistants use the Swagger MCP tools effectively, we've created a collection of prompts that guide them through common tasks. These prompts provide step-by-step instructions for processes like adding new endpoints, using generated models, and more.

Check out the [PROMPTS.md](./PROMPTS.md) file for the full collection of prompts.

Example use case: When asking an AI assistant to add a new endpoint to your project, you can reference the "Adding a New Endpoint" prompt to ensure the assistant follows the correct process in the right order.
