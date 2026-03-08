#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx tsx src/prisma/seed.ts || echo "Seed skipped or already applied"

echo "Starting server..."
exec npx tsx src/index.ts
