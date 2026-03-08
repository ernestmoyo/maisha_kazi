# ── Stage 1: Build React client ──────────────────────────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ .
RUN npm run build

# ── Stage 2: Production runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install all deps (tsx needed at runtime for Prisma generated .ts files)
COPY server/package*.json ./
RUN npm ci

# Generate Prisma client
COPY server/prisma ./prisma/
COPY server/prisma.config.ts ./
RUN npx prisma generate

# Copy server source (tsx runs TypeScript directly, no tsc build needed)
COPY server/tsconfig.json ./
COPY server/src ./src/

# Copy built client into client-dist (served by Express in production)
COPY --from=client-builder /app/client/dist ./client-dist

# Copy entrypoint
COPY server/entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
