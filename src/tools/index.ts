/**
 * Tools index file
 * Exports all tool definitions and implementations
 */

import { getSwaggerDefinition } from './getSwaggerDefinition.js';
import { listEndpoints } from './listEndpoints.js';
import { listEndpointModels } from './listEndpointModels.js';
import { generateModelCode } from './generateModelCode.js';
import { generateEndpointToolCode } from './generateEndpointToolCode.js';
import { version } from './version.js';

// Tool definitions array
export const toolDefinitions = [
  getSwaggerDefinition,
  listEndpoints,
  listEndpointModels,
  generateModelCode,
  generateEndpointToolCode,
  version
];

// Export all tool handlers
export { handleGetSwaggerDefinition } from './getSwaggerDefinition.js';
export { handleListEndpoints } from './listEndpoints.js';
export { handleListEndpointModels } from './listEndpointModels.js';
export { handleGenerateModelCode } from './generateModelCode.js';
export { handleGenerateEndpointToolCode } from './generateEndpointToolCode.js';
export { handleVersion } from './version.js';