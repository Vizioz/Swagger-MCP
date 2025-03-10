/**
 * Prompts index file
 * Exports all prompt definitions and handlers
 */

import { addEndpointPrompt, addEndpointArgsSchema, handleAddEndpointPrompt } from './addEndpoint.js';

// Export prompt definitions
export const promptDefinitions = [
  addEndpointPrompt
];

// Define a type for the prompt handlers
export type PromptHandlers = {
  [key: string]: {
    schema: any;
    handler: (args: any) => Promise<any>;
  }
};

// Export prompt handlers with proper typing
export const promptHandlers: PromptHandlers = {
  "add-endpoint": {
    schema: addEndpointArgsSchema,
    handler: handleAddEndpointPrompt
  }
}; 