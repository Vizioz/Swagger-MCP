import logger from '../utils/logger.js';
import axios from 'axios';
import { GetSwaggerParams , SavedSwaggerDefinition } from './core/interfaces.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Fetches Swagger definition
 * @param params Optional query parameters for filtering projects
 * @returns The API response with project data
 */
export const getSwaggerDefinition = async (params?: GetSwaggerParams) => {
  try {
    logger.info('Fetching Swagger definition from ' + params?.url);
    if (!params?.url) {
      throw new Error('URL is required');
    }
    const response = await axios.get(params?.url);

    // If the response is not a valid Swagger definition, throw an error
    if (!response.data.openapi && !response.data.swagger) {
      logger.error('Invalid Swagger definition');
      throw new Error('Invalid Swagger definition');
    }

    // If the response is a valid Swagger definition, save it as a hashed filename of the URL
    const url = new URL(params?.url);
    const filename = crypto.createHash('sha256').update(url.toString()).digest('hex') + '.json';
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));

    const savedSwaggerDefinition: SavedSwaggerDefinition = {
      filename: filename,
      url: params?.url,
      type: response.data.openapi ? 'openapi' : 'swagger'
    };
    // Return the Swagger definition
    return savedSwaggerDefinition;
  } catch (error: any) {
    logger.error(`Swagger API error: ${error.message}`);
    throw new Error('Failed to fetch Swagger definition');
  }
};

export default getSwaggerDefinition; 