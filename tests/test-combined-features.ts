// Test script for all combined features: singularization, API/version inclusion, and format suffix
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define types
interface Operation {
  operationId?: string;
  produces?: string[];
  responses?: {
    [key: string]: {
      content?: {
        [key: string]: Record<string, unknown>;
      };
    };
  };
  [key: string]: unknown;
}

interface TestCase {
  name: string;
  path: string;
  method: string;
  includeApiInName: boolean;
  includeVersionInName: boolean;
  singularizeResourceNames: boolean;
  operation: Operation;
}

// Helper functions
function camelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]+$/, '')
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function pascalCase(str: string): string {
  const camelStr = camelCase(str);
  return camelStr.charAt(0).toUpperCase() + camelStr.slice(1);
}

function formatMethodName(method: string): string {
  return method.toLowerCase() === 'get' ? 'Get' :
         method.toLowerCase() === 'post' ? 'Create' :
         method.toLowerCase() === 'put' ? 'Update' :
         method.toLowerCase() === 'delete' ? 'Delete' :
         method.toLowerCase() === 'patch' ? 'Patch' :
         pascalCase(method);
}

function getFormatSuffix(endpointPath: string, operation: Operation): string {
  // Check for file extension in the path
  if (endpointPath.endsWith('.pdf')) {
    return 'AsPdf';
  } else if (endpointPath.endsWith('.csv')) {
    return 'AsCsv';
  } else if (endpointPath.endsWith('.xlsx') || endpointPath.endsWith('.xls')) {
    return 'AsExcel';
  } else if (endpointPath.endsWith('.html')) {
    return 'AsHtml';
  } else if (endpointPath.endsWith('.xml')) {
    return 'AsXml';
  } else if (endpointPath.endsWith('.txt')) {
    return 'AsText';
  }

  // Check for content type in produces field (Swagger 2.0)
  if (operation.produces && Array.isArray(operation.produces)) {
    const contentType = operation.produces[0];
    if (contentType === 'application/pdf') {
      return 'AsPdf';
    } else if (contentType === 'text/csv') {
      return 'AsCsv';
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
               contentType === 'application/vnd.ms-excel') {
      return 'AsExcel';
    } else if (contentType === 'text/html') {
      return 'AsHtml';
    } else if (contentType === 'application/xml' || contentType === 'text/xml') {
      return 'AsXml';
    } else if (contentType === 'text/plain') {
      return 'AsText';
    }
  }

  // Check for content type in responses field (OpenAPI 3.0.x)
  if (operation.responses && operation.responses['200'] && operation.responses['200'].content) {
    const contentTypes = Object.keys(operation.responses['200'].content);
    if (contentTypes.includes('application/pdf')) {
      return 'AsPdf';
    } else if (contentTypes.includes('text/csv')) {
      return 'AsCsv';
    } else if (contentTypes.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || 
               contentTypes.includes('application/vnd.ms-excel')) {
      return 'AsExcel';
    } else if (contentTypes.includes('text/html')) {
      return 'AsHtml';
    } else if (contentTypes.includes('application/xml') || contentTypes.includes('text/xml')) {
      return 'AsXml';
    } else if (contentTypes.includes('text/plain')) {
      return 'AsText';
    }
  }

  return '';
}

// Helper function to singularize a word
function singularize(word: string): string {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  } else if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

function generateToolName(
  operation: Operation, 
  endpointPath: string, 
  method: string,
  includeApiInName: boolean = false,
  includeVersionInName: boolean = false,
  singularizeResourceNames: boolean = true
): string {
  // If operationId is present, use it as the base for the tool name
  if (operation.operationId) {
    return pascalCase(formatMethodName(method) + operation.operationId) + getFormatSuffix(endpointPath, operation);
  }

  // Otherwise, generate a name based on the path
  const segments = endpointPath.split('/').filter(s => s && s !== '');
  
  // Remove file extension if present
  const lastSegment = segments[segments.length - 1];
  if (lastSegment && lastSegment.includes('.')) {
    segments[segments.length - 1] = lastSegment.split('.')[0];
  }
  
  // Filter out API and version segments if not needed
  const filteredSegments = segments.filter((segment, index) => {
    // Keep the segment if it's not 'api' or if includeApiInName is true
    if (segment.toLowerCase() === 'api') {
      return includeApiInName;
    }
    
    // Keep the segment if it's not a version (v1, v2, etc.) or if includeVersionInName is true
    if (/^v\d+$/.test(segment)) {
      return includeVersionInName;
    }
    
    return true;
  });
  
  // Process the segments
  const processedSegments = filteredSegments.map((segment, index) => {
    // Singularize resource names if needed
    if (singularizeResourceNames && (index === 0 || index < filteredSegments.length - 1)) {
      return pascalCase(singularize(segment));
    }
    return pascalCase(segment);
  });
  
  // Combine the method and segments to form the tool name
  const toolName = formatMethodName(method) + processedSegments.join('');
  
  // Add format suffix if applicable
  return toolName + getFormatSuffix(endpointPath, operation);
}

// Test the combined features
function testCombinedFeatures(): void {
  console.log('Testing all combined features: singularization, API/version inclusion, and format suffix\n');
  
  // Define test cases with different combinations of features
  const testCases: TestCase[] = [
    {
      name: "Default options with PDF format",
      path: "/projects/api/v3/tasklists.pdf",
      method: "GET",
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true,
      operation: {}
    },
    {
      name: "Include API with CSV format",
      path: "/projects/api/v3/tasklists.csv",
      method: "GET",
      includeApiInName: true,
      includeVersionInName: false,
      singularizeResourceNames: true,
      operation: {}
    },
    {
      name: "Include version with Excel format",
      path: "/projects/api/v3/tasklists.xlsx",
      method: "GET",
      includeApiInName: false,
      includeVersionInName: true,
      singularizeResourceNames: true,
      operation: {}
    },
    {
      name: "Include API and version with HTML format",
      path: "/projects/api/v3/tasklists.html",
      method: "GET",
      includeApiInName: true,
      includeVersionInName: true,
      singularizeResourceNames: true,
      operation: {}
    },
    {
      name: "No singularization with XML format",
      path: "/projects/api/v3/tasklists.xml",
      method: "GET",
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: false,
      operation: {}
    },
    {
      name: "Complex path with PDF format",
      path: "/projects/api/v3/companies/tasks.pdf",
      method: "GET",
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true,
      operation: {}
    },
    {
      name: "Complex path with API and version with CSV format",
      path: "/projects/api/v3/companies/tasks.csv",
      method: "GET",
      includeApiInName: true,
      includeVersionInName: true,
      singularizeResourceNames: true,
      operation: {}
    },
    {
      name: "Format from produces field",
      path: "/projects/api/v3/tasklists",
      method: "GET",
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true,
      operation: { produces: ['application/pdf'] }
    },
    {
      name: "Format from responses field",
      path: "/projects/api/v3/tasklists",
      method: "GET",
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true,
      operation: { responses: { '200': { content: { 'text/csv': {} } } } }
    },
    {
      name: "POST method with format",
      path: "/projects/api/v3/tasklists.pdf",
      method: "POST",
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true,
      operation: {}
    }
  ];
  
  // Run each test case
  testCases.forEach((testCase, index) => {
    try {
      const toolName = generateToolName(
        testCase.operation,
        testCase.path,
        testCase.method,
        testCase.includeApiInName,
        testCase.includeVersionInName,
        testCase.singularizeResourceNames
      );
      
      console.log(`${index + 1}. ${testCase.name}:`);
      console.log(`   Path: ${testCase.path}`);
      console.log(`   Method: ${testCase.method}`);
      console.log(`   Include API: ${testCase.includeApiInName}`);
      console.log(`   Include Version: ${testCase.includeVersionInName}`);
      console.log(`   Singularize: ${testCase.singularizeResourceNames}`);
      console.log(`   Generated Tool Name: ${toolName}`);
      console.log();
    } catch (error: any) {
      console.error(`Error in test case ${index + 1} (${testCase.name}):`, error);
    }
  });
}

// Run the test
testCombinedFeatures(); 