# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Production image ─────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy installed node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY src/ ./src/
COPY package.json ./

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the port the app runs on
EXPOSE 5000

# Health check — Render will also use this
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "src/app.js"]