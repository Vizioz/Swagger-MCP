/**
 * version tool
 * Returns the current version of the MCP server
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

// Get the directory of this file to locate package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tool definition
export const version = {
  name: "version",
  description: "Returns the current version number of the Swagger MCP Server.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

// Tool handler
export async function handleVersion(_input: any) {
  logger.info('Calling version handler');

  try {
    // Navigate from build/tools/ to the root package.json
    const packageJsonPath = path.resolve(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const versionNumber = packageJson.version || "unknown";

    logger.info(`Returning version: ${versionNumber}`);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ version: versionNumber }, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error(`Error in version handler: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: `Error retrieving version: ${error.message}`
      }]
    };
  }
}

