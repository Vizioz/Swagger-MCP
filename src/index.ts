import dotenv from 'dotenv';
import minimist from 'minimist';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// Load environment variables from .env file
dotenv.config();

import logger from "./utils/logger.js";

// Parse command line arguments
const argv = minimist(process.argv.slice(2));
const swaggerUrlFromCLI = argv['swagger-url'] || argv.swaggerUrl || null;

// Store swagger URL in a way accessible to other modules
if (swaggerUrlFromCLI) {
  process.env.SWAGGER_URL_FROM_CLI = swaggerUrlFromCLI;
  logger.info(`Swagger URL from CLI: ${swaggerUrlFromCLI}`);
}

// Import tool definitions and handlers
import {
  toolDefinitions,
  handleGetSwaggerDefinition,
  handleListEndpoints,
  handleListEndpointModels,
  handleGenerateModelCode,
  handleGenerateEndpointToolCode
} from "./tools/index.js";

// Import prompt definitions and handlers
import { promptDefinitions, promptHandlers } from "./prompts/index.js";

// Create MCP server
const server = new Server(
  {
    name: 'Swagger MCP Server',
    description: 'A server that helps you build a MCP wrapper around your Swagger API',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {}
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes tools for interacting with Swagger API.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions
  };
});

/**
 * Handler that lists available prompts.
 * Exposes prompts for guiding through common workflows.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: promptDefinitions
  };
});

/**
 * Handler for getting a specific prompt.
 * Returns the prompt template with messages.
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  try {
    const promptName = request.params.name;
    const promptArgs = request.params.arguments || {};

    logger.info(`Prompt request received: ${promptName}`);
    logger.info(`Prompt arguments: ${JSON.stringify(promptArgs)}`);

    const promptHandler = promptHandlers[promptName];

    if (!promptHandler) {
      return {
        error: {
          code: -32601,
          message: `Unknown prompt: ${promptName}`
        }
      };
    }

    // Validate arguments against schema
    const validationResult = promptHandler.schema.safeParse(promptArgs);
    if (!validationResult.success) {
      return {
        error: {
          code: -32602,
          message: `Invalid arguments: ${validationResult.error.message}`
        }
      };
    }

    // Call the prompt handler
    const result = await promptHandler.handler(promptArgs);
    return result;
  } catch (error: any) {
    logger.error(`MCP prompt error: ${error.message}`);
    throw new Error(`Prompt execution failed: ${error.message}`);
  }
});

/**
 * Handler for tool calls.
 * Processes requests to call Swagger API tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    logger.info(`Tool call received: ${request.params.name}`);
    logger.info(`Tool arguments: ${JSON.stringify(request.params.arguments || {})}`);

    const name = request.params.name;
    const input = request.params.arguments;

    switch (name) {
      case "getSwaggerDefinition":
        return await handleGetSwaggerDefinition(input);

      case "listEndpoints":
        return await handleListEndpoints(input);

      case "listEndpointModels":
        return await handleListEndpointModels(input);

      case "generateModelCode":
        return await handleGenerateModelCode(input);

      case "generateEndpointToolCode":
        return await handleGenerateEndpointToolCode(input);

      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${name}`
          }]
        };
    }
  } catch (error: any) {
    logger.error(`MCP tool error: ${error.message}`);
    throw new Error(`Tool execution failed: ${error.message}`);
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  // Connect using stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  logger.error("Server error:", error);
  process.exit(1);
});