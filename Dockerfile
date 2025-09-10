FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry
# ENV NEXT_TELEMETRY_DISABLED=1

# Build the application using a dedicated script that doesn't trigger prebuild
# This prevents the recursive Docker-in-Docker dependency
RUN npm run build:docker

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line to disable telemetry during runtime
# ENV NEXT_TELEMETRY_DISABLED=1

# Install production dependencies for initialization scripts
COPY package.json package-lock.json* ./
RUN npm install --production=true pg ioredis amqplib @aws-sdk/client-s3 @aws-sdk/s3-request-presigner dotenv

# Create a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy initialization scripts and data
COPY --from=builder /app/scripts/init-services.js ./scripts/init-services.js
COPY --from=builder /app/scripts/wait-for-services.js ./scripts/wait-for-services.js
COPY --from=builder /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY --from=builder /app/data/schema.sql ./data/schema.sql
RUN chmod +x ./scripts/docker-entrypoint.sh

# Set the correct permission for prerender cache
RUN mkdir -p .next/cache
RUN chown -R nextjs:nodejs .next

# Switch to non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set the environment variable for the application to listen on all interfaces
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use the entrypoint script to handle initialization and startup
CMD ["./scripts/docker-entrypoint.sh"]
