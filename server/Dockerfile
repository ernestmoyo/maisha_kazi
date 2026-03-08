# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps (including devDependencies for TypeScript compiler)
COPY package*.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Compile TypeScript → dist/
# noEmitOnError defaults to false, so tsc emits JS even with type errors
COPY tsconfig.json ./
COPY src ./src/
RUN npx tsc

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Re-generate Prisma client for this platform (native binary compatibility)
COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled server code from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory (will be overridden by volume in prod)
RUN mkdir -p /app/uploads

# Copy and prepare entrypoint
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
