# ── Stage 1: Build React client ──────────────────────────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ .
RUN npm run build

# ── Stage 2: Build Express server ────────────────────────────────────────────
FROM node:20-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/prisma ./prisma/
COPY server/prisma.config.ts ./
RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src ./src/
RUN npx tsc || true

# ── Stage 3: Production runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install production deps for server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Re-generate Prisma client for this platform
COPY server/prisma ./prisma/
COPY server/prisma.config.ts ./
RUN npx prisma generate

# Copy compiled server
COPY --from=server-builder /app/server/dist ./dist

# Copy built client into client-dist (served by Express in production)
COPY --from=client-builder /app/client/dist ./client-dist

# Copy entrypoint
COPY server/entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
