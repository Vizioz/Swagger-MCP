export interface GetSwaggerParams {
    // String parameters
    url: string;
    saveLocation: string; // Required parameter for where to save the Swagger file
}

export interface SavedSwaggerDefinition {
    filePath: string; // Full path to the saved file
    url: string;
    type: string;
}

export interface SwaggerFileParams {
    swaggerFilePath: string; // Required parameter for the path to the Swagger file
}
