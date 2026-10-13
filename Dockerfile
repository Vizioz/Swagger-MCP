# Swagger MCP server (stdio transport).
# The server talks MCP over stdin/stdout, so run it with `docker run -i` / `stdin_open: true`.

# ---- Build stage ----
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
# Compile directly with tsc: `npm run build` also copies .env, which isn't part of the image
RUN npx tsc

# ---- Runtime stage ----
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    LOG_LEVEL=info

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# package.json is read at runtime by the `version` tool (build/tools -> ../../package.json)
COPY --from=build /app/build ./build

# swagger-cache: downloaded definitions (--swagger-url); logs: winston file transports
RUN mkdir -p /app/swagger-cache /app/logs && chown -R node:node /app
USER node

VOLUME ["/app/swagger-cache", "/app/logs"]

# Optional: set SWAGGER_URL to pass --swagger-url; extra args are appended
ENTRYPOINT ["sh", "-c", "exec node build/index.js ${SWAGGER_URL:+--swagger-url=\"$SWAGGER_URL\"} \"$@\"", "--"]
