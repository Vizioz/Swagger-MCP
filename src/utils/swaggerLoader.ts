/**
 * Swagger Loader Utility
 * Loads Swagger definition from SWAGGER_URL environment variable
 * Downloads and caches the file if needed
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';
import yaml from 'js-yaml';
import logger from './logger.js';

// Load environment variables
dotenv.config();

// Cache directory for swagger files
const SWAGGER_CACHE_DIR = path.join(process.cwd(), 'swagger-cache');

// Ensure cache directory exists (handle race conditions safely)
try {
    fs.mkdirSync(SWAGGER_CACHE_DIR, { recursive: true });
} catch (err: any) {
    if (err.code !== 'EEXIST') {
        throw err;
    }
}

/**
 * Gets the Swagger URL from CLI argument (highest priority)
 * @returns The Swagger URL or null if not set
 */
export function getSwaggerUrlFromCLI(): string | null {
    const url = process.env.SWAGGER_URL_FROM_CLI;
    if (!url) {
        return null;
    }
    return url.trim();
}


/**
 * Downloads and caches a Swagger file from URL
 * Handles both JSON and YAML formats
 * @param url The Swagger URL
 * @returns The path to the cached file
 */
async function downloadAndCacheSwagger(url: string): Promise<string> {
    try {
        logger.info(`Downloading Swagger definition from ${url}`);

        const response = await axios.get(url, {
            responseType: 'text', // Get raw text to handle both JSON and YAML
            headers: {
                'Accept': 'application/json, application/yaml, text/yaml'
            }
        });

        // Check if response is YAML or JSON
        const isYaml = url.endsWith('.yaml') || url.endsWith('.yml') ||
            response.headers['content-type']?.includes('yaml') ||
            (!response.data.trim().startsWith('{') && !response.data.trim().startsWith('['));

        // Parse the response
        let swaggerData: any;
        if (isYaml) {
            swaggerData = yaml.load(response.data);
        } else {
            swaggerData = JSON.parse(response.data);
        }

        // Validate it's a Swagger/OpenAPI definition
        if (!swaggerData.openapi && !swaggerData.swagger) {
            throw new Error('Invalid Swagger definition: missing required "openapi" or "swagger" field');
        }

        // Generate cache filename based on URL hash
        const urlObj = new URL(url);
        const filename = crypto.createHash('sha256').update(urlObj.toString()).digest('hex');
        const fileExtension = isYaml ? '.yaml' : '.json';
        const filePath = path.join(SWAGGER_CACHE_DIR, `${filename}${fileExtension}`);

        // Save the file
        if (isYaml) {
            fs.writeFileSync(filePath, response.data, 'utf8');
        } else {
            fs.writeFileSync(filePath, JSON.stringify(swaggerData, null, 2), 'utf8');
        }

        logger.info(`Swagger definition cached at ${filePath}`);
        return filePath;
    } catch (error: any) {
        logger.error(`Failed to download Swagger definition: ${error.message}`);
        throw new Error(`Failed to download Swagger definition from ${url}: ${error.message}`);
    }
}

/**
 * Loads Swagger definition from file path
 * @param swaggerFilePath Path to the Swagger file
 * @returns The Swagger definition object
 */
export async function loadSwaggerDefinitionFromFile(swaggerFilePath: string): Promise<any> {
    if (!fs.existsSync(swaggerFilePath)) {
        throw new Error(`Swagger file not found at ${swaggerFilePath}`);
    }

    logger.info(`Reading Swagger definition from ${swaggerFilePath}`);
    const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8');

    // Parse based on file extension
    if (swaggerFilePath.endsWith('.yml') || swaggerFilePath.endsWith('.yaml')) {
        return yaml.load(swaggerContent);
    } else {
        return JSON.parse(swaggerContent);
    }
}

/**
 * Loads Swagger definition content from URL or cache
 * Priority: CLI --swagger-url > swaggerFilePath parameter
 * @param swaggerFilePath Optional file path to Swagger file (used if no CLI arg)
 * @returns The Swagger definition object
 */
export async function loadSwaggerDefinition(swaggerFilePath?: string): Promise<any> {
    // Check CLI argument first (highest priority)
    const swaggerUrlFromCLI = getSwaggerUrlFromCLI();

    if (swaggerUrlFromCLI) {
        logger.info(`Using Swagger URL from CLI: ${swaggerUrlFromCLI}`);
        return await loadSwaggerDefinitionFromUrl(swaggerUrlFromCLI);
    }

    // Check swaggerFilePath parameter (fallback)
    if (swaggerFilePath) {
        logger.info(`Using Swagger file path: ${swaggerFilePath}`);
        return await loadSwaggerDefinitionFromFile(swaggerFilePath);
    }

    // If none provided, throw error
    throw new Error('Swagger URL or file path is required. Provide --swagger-url=<url> as CLI argument, or swaggerFilePath parameter.');
}

/**
 * Loads Swagger definition from URL (downloads and caches if needed)
 * @param swaggerUrl The Swagger URL
 * @returns The Swagger definition object
 */
async function loadSwaggerDefinitionFromUrl(swaggerUrl: string): Promise<any> {

    // Generate cache filename based on URL hash
    const urlObj = new URL(swaggerUrl);
    const filename = crypto.createHash('sha256').update(urlObj.toString()).digest('hex');
    const cacheFilePath = path.join(SWAGGER_CACHE_DIR, `${filename}.json`);
    const cacheFilePathYaml = path.join(SWAGGER_CACHE_DIR, `${filename}.yaml`);

    // Check if cached file exists
    let cachedFilePath: string | null = null;
    if (fs.existsSync(cacheFilePath)) {
        cachedFilePath = cacheFilePath;
    } else if (fs.existsSync(cacheFilePathYaml)) {
        cachedFilePath = cacheFilePathYaml;
    }

    // If not cached, download it
    if (!cachedFilePath) {
        logger.info(`Swagger definition not found in cache, downloading from ${swaggerUrl}`);
        cachedFilePath = await downloadAndCacheSwagger(swaggerUrl);
    } else {
        logger.info(`Using cached Swagger definition from ${cachedFilePath}`);
    }

    // Read and parse the file
    return await loadSwaggerDefinitionFromFile(cachedFilePath);
}

/**
 * Gets the cached file path for the Swagger definition
 * Downloads it if not cached
 * Priority: CLI --swagger-url > swaggerFilePath parameter
 * @param swaggerFilePath Optional file path to Swagger file (used if no CLI arg)
 * @returns The path to the Swagger file
 */
export async function getSwaggerFilePath(swaggerFilePath?: string): Promise<string> {
    // Check CLI argument first (highest priority)
    const swaggerUrlFromCLI = getSwaggerUrlFromCLI();

    if (swaggerUrlFromCLI) {
        // Generate cache filename based on URL hash
        const urlObj = new URL(swaggerUrlFromCLI);
        const filename = crypto.createHash('sha256').update(urlObj.toString()).digest('hex');
        const cacheFilePath = path.join(SWAGGER_CACHE_DIR, `${filename}.json`);
        const cacheFilePathYaml = path.join(SWAGGER_CACHE_DIR, `${filename}.yaml`);

        // Check if cached file exists
        if (fs.existsSync(cacheFilePath)) {
            return cacheFilePath;
        } else if (fs.existsSync(cacheFilePathYaml)) {
            return cacheFilePathYaml;
        }

        // If not cached, download it
        logger.info(`Swagger definition not found in cache, downloading from ${swaggerUrlFromCLI}`);
        return await downloadAndCacheSwagger(swaggerUrlFromCLI);
    }

    // Check swaggerFilePath parameter (fallback)
    if (swaggerFilePath) {
        if (!fs.existsSync(swaggerFilePath)) {
            throw new Error(`Swagger file not found at ${swaggerFilePath}`);
        }
        return swaggerFilePath;
    }

    // If none provided, throw error
    throw new Error('Swagger URL or file path is required. Provide --swagger-url=<url> as CLI argument, or swaggerFilePath parameter.');
}

