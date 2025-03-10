/**
 * Add Endpoint Prompt
 * Defines a reusable prompt template for guiding an agent through the process of adding a new endpoint
 */

import { z } from 'zod';

// Define the prompt schema with arguments
export const addEndpointPrompt = {
  name: "add-endpoint",
  description: "Guide through the process of adding a new endpoint using Swagger MCP tools",
  arguments: [
    {
      name: "swaggerUrl",
      description: "URL of the Swagger definition (optional if already configured)",
      required: false
    },
    {
      name: "endpointPath",
      description: "Path of the endpoint to implement (e.g., /pets/{id})",
      required: false
    },
    {
      name: "httpMethod",
      description: "HTTP method of the endpoint (e.g., GET, POST, PUT, DELETE)",
      required: false
    }
  ]
};

// Define the argument schema for validation
export const addEndpointArgsSchema = z.object({
  swaggerUrl: z.string().optional(),
  endpointPath: z.string().optional(),
  httpMethod: z.string().optional()
});

// Handler function that generates the prompt messages
export async function handleAddEndpointPrompt(args: z.infer<typeof addEndpointArgsSchema>) {
  const { swaggerUrl, endpointPath, httpMethod } = args;
  
  // Create the messages array for the prompt
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to add a new endpoint to my project${endpointPath ? ` (${httpMethod || ''} ${endpointPath})` : ''}${swaggerUrl ? ` from the Swagger definition at ${swaggerUrl}` : ''}.`
        }
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "I'll guide you through adding a new endpoint using the Swagger MCP tools. Let's follow these steps in order:"
        }
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "**Step 1:** First, we need to get the Swagger definition.\n\nI'll use the `mcp__getSwaggerDefinition` tool to download and save it locally."
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "Great, please proceed with downloading the Swagger definition."
        }
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "**Step 2:** Now I'll list all available endpoints using the `mcp__listEndpoints` tool.\n\nThis will help us understand the API structure and confirm the endpoint we want to implement."
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "Please show me the available endpoints."
        }
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "**Step 3:** Let's identify the models used by our target endpoint with the `mcp__listEndpointModels` tool.\n\nThis will show us all the data models we need to generate."
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "Please identify the models for this endpoint."
        }
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "**Step 4:** Now I'll generate TypeScript code for each model using the `mcp__generateModelCode` tool.\n\nI'll do this for each model identified in the previous step."
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "Please generate the model code."
        }
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "**Step 5:** Finally, I'll generate the MCP tool definition using the `mcp__generateEndpointToolCode` tool.\n\nThis will create a complete MCP tool definition for the endpoint."
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "Please generate the endpoint tool code."
        }
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "**Step 6:** Now we need to implement any additional logic needed for the tool handler:\n\n- Authentication handling\n- Error handling\n- File upload/download support (if needed)\n- Integration with your application's services"
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "What else do I need to do to complete the implementation?"
        }
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "**Step 7:** The final steps are:\n\n1. Register the new tool in your MCP server configuration\n2. Test the endpoint with sample requests\n\nWould you like me to help with any of these steps?"
        }
      }
    ]
  };
} 