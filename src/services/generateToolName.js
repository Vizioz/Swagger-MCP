// Standalone test for the generateToolName function

/**
 * Formats the HTTP method for use in a function name
 */
function formatMethodName(method) {
  // Capitalize the first letter, lowercase the rest
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
}

/**
 * Converts a string to camelCase
 */
function camelCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]+/g, '')
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

/**
 * Converts a string to PascalCase
 */
function pascalCase(str) {
  const camelCased = camelCase(str);
  return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
}

/**
 * Gets a suffix for the tool name based on the response format
 */
function getFormatSuffix(endpointPath, operation) {
  // Check for format in the path extension
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
  
  // Check for format in the produces field (Swagger 2.0)
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
  
  // Check for format in the responses (OpenAPI 3.0.x)
  if (operation.responses) {
    for (const statusCode in operation.responses) {
      const response = operation.responses[statusCode];
      if (response.content) {
        if (response.content['application/pdf']) {
          return 'AsPdf';
        } else if (response.content['text/csv']) {
          return 'AsCsv';
        } else if (response.content['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] || 
                   response.content['application/vnd.ms-excel']) {
          return 'AsExcel';
        } else if (response.content['text/html']) {
          return 'AsHtml';
        } else if (response.content['application/xml'] || response.content['text/xml']) {
          return 'AsXml';
        } else if (response.content['text/plain']) {
          return 'AsText';
        }
      }
    }
  }
  
  // Default: no suffix for JSON or unspecified formats
  return '';
}

/**
 * Generates a tool name from the operation details
 */
function generateToolName(
  operation, 
  endpointPath, 
  method,
  includeApiInName,
  includeVersionInName,
  singularizeResourceNames
) {
  // Detect response format from the endpoint path
  const formatSuffix = getFormatSuffix(endpointPath, operation);
  
  // Use operationId if available and transform it
  if (operation.operationId) {
    // Remove HTTP method prefix if present (e.g., GET_, POST_)
    let name = operation.operationId.replace(/^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)_/i, '');
    
    // Remove file extensions
    name = name.replace(/\.\w+$/, '');
    
    // Split the name into segments
    const segments = name.split('_');
    
    // Filter out API and version segments if not wanted
    const filteredSegments = segments.filter((segment) => {
      if (!includeApiInName && segment.toLowerCase() === 'api') {
        return false;
      }
      
      if (!includeVersionInName && /^v\d+(\.\d+)*$/.test(segment)) {
        return false;
      }
      
      return true;
    });
    
    // Process the remaining segments
    const processedSegments = filteredSegments.map((segment, index, array) => {
      // If singularization is enabled and it's a resource name (not the last segment)
      if (singularizeResourceNames && (index === 0 || index < array.length - 1) && segment.endsWith('s')) {
        // Simple singularization - remove trailing 's'
        // This is a simplified approach - a proper singularization would use a library
        return segment.endsWith('ies') 
          ? segment.slice(0, -3) + 'y'  // e.g., "companies" -> "company"
          : segment.endsWith('s') 
            ? segment.slice(0, -1)      // e.g., "projects" -> "project"
            : segment;
      }
      
      return segment;
    });
    
    // Combine the method with the processed segments and format suffix
    return formatMethodName(method) + processedSegments.map(pascalCase).join('') + formatSuffix;
  }
  
  // Otherwise, generate from path and method
  const pathSegments = endpointPath.split('/')
    .filter(part => part && !part.startsWith('{')) // Remove empty parts and path parameters
    .map(part => part.replace(/\.\w+$/, '')); // Remove file extensions
  
  // Filter out API and version segments if not wanted
  const filteredSegments = pathSegments.filter(segment => {
    if (!includeApiInName && segment.toLowerCase() === 'api') {
      return false;
    }
    
    if (!includeVersionInName && /^v\d+(\.\d+)*$/.test(segment)) {
      return false;
    }
    
    return true;
  });
  
  // Process the remaining segments
  const processedSegments = filteredSegments.map((segment, index, array) => {
    // If singularization is enabled and it's a resource name (not the last segment)
    if (singularizeResourceNames && (index === 0 || index < array.length - 1) && segment.endsWith('s')) {
      // Simple singularization - remove trailing 's'
      // This is a simplified approach - a proper singularization would use a library
      return segment.endsWith('ies') 
        ? segment.slice(0, -3) + 'y'  // e.g., "companies" -> "company"
        : segment.endsWith('s') 
          ? segment.slice(0, -1)      // e.g., "projects" -> "project"
          : segment;
    }
    
    return segment;
  });
  
  // Combine the method with the path segments and format suffix
  const nameBase = processedSegments.map(pascalCase).join('');
  return formatMethodName(method) + nameBase + formatSuffix;
}

// Test the function with different parameters
function testGenerateToolName() {
  console.log('Testing generateToolName function with different parameters:');
  
  // Mock operation object
  const mockOperation = {
    operationId: 'GET_projects_api_v3_tasks.json',
    summary: 'Get all tasks',
    description: 'Return multiple tasks according to the provided filter.'
  };
  
  // Mock path and method
  const mockPath = '/projects/api/v3/tasks.json';
  const mockMethod = 'GET';
  
  // Test 1: Default options
  const test1 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('1. Default options (no API, no version, singularize):', test1);
  
  // Test 2: Include API
  const test2 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('2. Include API in name:', test2);
  
  // Test 3: Include version
  const test3 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('3. Include version in name:', test3);
  
  // Test 4: Include both API and version
  const test4 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('4. Include both API and version in name:', test4);
  
  // Test 5: No singularization
  const test5 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
  console.log('5. Without singularization:', test5);
  
  // Test 6: Without operationId
  const noOperationIdMock = { ...mockOperation };
  delete noOperationIdMock.operationId;
  
  const test6 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('6. Without operationId (no API, no version, singularize):', test6);
  
  // Test 7: Without operationId, include API
  const test7 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('7. Without operationId, include API:', test7);
  
  // Test 8: Without operationId, include version
  const test8 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('8. Without operationId, include version:', test8);
  
  // Test 9: Without operationId, no singularization
  const test9 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
  console.log('9. Without operationId, no singularization:', test9);
  
  // Test 10: Without operationId, include both API and version
  const test10 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('10. Without operationId, include both API and version:', test10);
  
  // Test with a more complex path
  const complexPath = '/projects/api/v3/companies/tasks.json';
  
  // Test 11: Complex path with singularization
  const test11 = generateToolName(
    { ...mockOperation, operationId: null }, 
    complexPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('11. Complex path with singularization:', test11);
  
  // Test 12: Complex path without singularization
  const test12 = generateToolName(
    { ...mockOperation, operationId: null }, 
    complexPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
  console.log('12. Complex path without singularization:', test12);
  
  // Test with different formats
  console.log('\nTesting with different formats:');
  
  // Test 13: PDF format
  const pdfPath = '/projects/api/v3/tasks.pdf';
  const test13 = generateToolName(
    { ...mockOperation, operationId: null }, 
    pdfPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('13. PDF format:', test13);
  
  // Test 14: CSV format
  const csvPath = '/projects/api/v3/tasks.csv';
  const test14 = generateToolName(
    { ...mockOperation, operationId: null }, 
    csvPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('14. CSV format:', test14);
  
  // Test 15: Excel format
  const excelPath = '/projects/api/v3/tasks.xlsx';
  const test15 = generateToolName(
    { ...mockOperation, operationId: null }, 
    excelPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('15. Excel format:', test15);
  
  // Test 16: HTML format
  const htmlPath = '/projects/api/v3/tasks.html';
  const test16 = generateToolName(
    { ...mockOperation, operationId: null }, 
    htmlPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('16. HTML format:', test16);
  
  // Test 17: Format from produces field
  const producesOperation = {
    ...mockOperation,
    operationId: null,
    produces: ['application/pdf']
  };
  const test17 = generateToolName(
    producesOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('17. Format from produces field (PDF):', test17);
  
  // Test 18: Format from responses content field
  const responsesOperation = {
    ...mockOperation,
    operationId: null,
    responses: {
      '200': {
        content: {
          'text/csv': {}
        }
      }
    }
  };
  const test18 = generateToolName(
    responsesOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('18. Format from responses content field (CSV):', test18);
}

// Run the test
testGenerateToolName(); 