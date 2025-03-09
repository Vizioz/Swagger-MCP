import logger from '../utils/logger.js';
import axios from 'axios';
import { GetSwaggerParams , SavedSwaggerDefinition } from './core/interfaces.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Fetches Swagger definition
 * @param params Parameters including URL and save location
 * @returns The saved Swagger definition information
 */
export const getSwaggerDefinition = async (params: GetSwaggerParams) => {
  try {
    logger.info('Fetching Swagger definition from ' + params.url);
    if (!params.url) {
      throw new Error('URL is required');
    }
    if (!params.saveLocation) {
      throw new Error('Save location is required');
    }
    const response = await axios.get(params.url);

    // If the response is not a valid Swagger definition, throw an error
    if (!response.data.openapi && !response.data.swagger) {
      logger.error('Invalid Swagger definition');
      throw new Error('Invalid Swagger definition');
    }

    // If the response is a valid Swagger definition, save it as a hashed filename of the URL
    const url = new URL(params.url);
    const filename = crypto.createHash('sha256').update(url.toString()).digest('hex') + '.json';
    
    // Use the provided save location
    const saveLocation = params.saveLocation;
    const filePath = path.join(saveLocation, filename);
    
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));

    const savedSwaggerDefinition: SavedSwaggerDefinition = {
      filePath: filePath, // Full path to the saved file
      url: params.url,
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