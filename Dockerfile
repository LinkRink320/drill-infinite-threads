# Build frontend
FROM node:20-alpine AS web
WORKDIR /app
COPY web/package*.json web/
RUN cd web && npm ci
COPY web web
RUN cd web && npm run build

# Build server
FROM node:20-alpine AS server
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src src
COPY --from=web /app/web/dist web/dist
RUN npm run build

# Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=server /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=server /app/dist dist
COPY --from=server /app/web/dist web/dist
COPY .env.example ./.env.example
EXPOSE 3000
CMD ["node", "dist/index.js"]
