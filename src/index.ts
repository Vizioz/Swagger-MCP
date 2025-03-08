import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import logger from "./utils/logger.js";

// Import tool definitions and handlers
import { toolDefinitions, 
  handleGetSwaggerDefinition
} from "./tools/index.js";

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
      
      default:
        throw new Error("Unknown tool");
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