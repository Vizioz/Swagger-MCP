# Swagger MCP

An MCP server that connects to a Swagger specification and helps an AI to build all the required models to generate a MCP server for that service.

## Features

- Downloads a Swagger specification and stores it locally for faster reference.
- Returns a list of all the endpoints and their HTTP Methods and descriptions
- Returns a list of all the models
- Returns a model
- Returns service to connect to the end point
- Returns MCP function definitions

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:

```
git clone https://github.com/readingdancer/swagger-mcp.git
cd swagger-mcp
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file based on the `.env.example` file:

```
cp .env.example .env
```

1. Update the `.env` file.

## Configuration

Edit the `.env` file to configure the application:

- `PORT`: The port on which the server will run (default: 3000)
- `NODE_ENV`: The environment (development, production, test)
- `LOG_LEVEL`: Logging level (info, error, debug)

## Usage

### Building the application

Build the application:

```
npm run build
```

This will compile the TypeScript code ready to be used as an MCP Server

### Running as an MCP Server

To run as an MCP server for integration with Cursor and other applications:

```
node build/index.js
```

### Using the MCP Inspector

To run the MCP inspector for debugging:

```
npm run inspector
```

### Adding to Cursor

To add this MCP server to Cursor:

1. Open Cursor Settings > Features > MCP
2. Click "+ Add New MCP Server"
3. Enter a name for the server (e.g., "Swagger MCP")
4. Select "stdio" as the transport type
5. Enter the command to run the server: `node path/to/swagger-mcp/build/index.js` and then if needed, add the command line arguments as mentioned above.
6. Click "Add"

The Swagger MCP tools will now be available to the Cursor Agent in Composer.

### Available Swagger MCP Tools

The following tools are available through the MCP server:

## Setting Up Your New Project

To let the Agent know which end point you are trying to use, you can either prompt it, or you can store it in a configuration file:

### Using a Configuration File

You can create a `.swagger-mcp` file in the root of your project with the following structure:

```
SWAGGER_URL = UrlToSwaggerEndpoint
```

This simple configuration file associates your current project with a specific Swagger API, we may use it to store more details in the future.

Once configured, the MCP will be able to find your Swagger definition and associate it with your current solution, reducing the number of API calls needed to get the project and tasks related to the solution you are working on.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
