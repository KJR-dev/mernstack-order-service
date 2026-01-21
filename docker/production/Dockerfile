# Use Dockerfile syntax version 1 (required for advanced features like RUN --mount)
# syntax=docker/dockerfile:1

# Define Node.js version as a build-time argument
ARG NODE_VERSION=21.7.1


# =========================
# 🧱 BUILD STAGE
# =========================
# Use lightweight Alpine-based Node.js image for building the app
FROM node:${NODE_VERSION}-alpine as builder

# Set working directory inside the container
WORKDIR /home/node/app

# Install dependencies using npm ci
# - Bind-mount package.json and package-lock.json from host
# - Use npm cache to speed up future builds
# - npm ci installs exact versions from package-lock.json
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy entire project source code into the container
COPY . .

# Build the application (usually generates dist/ folder)
RUN npm run build


# =========================
# 🚀 PRODUCTION (RUNNER) STAGE
# =========================
# Start a fresh lightweight Node.js image for production
FROM node:${NODE_VERSION}-alpine as runner

# Run container as non-root user for better security
USER node

# Create application directory
RUN mkdir -p /home/node/app

# Set working directory
WORKDIR /home/node/app

# Set environment to production
ENV NODE_ENV=production

# Install only production dependencies
# - --omit=dev skips devDependencies
# - --ignore-scripts avoids running postinstall scripts
# - Uses cache for faster installs
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts

# Copy only the built output (dist folder) from builder stage
# --chown ensures correct file ownership for node user
COPY --from=builder --chown=node:node /home/node/app/dist ./

# Expose the application port
EXPOSE 5501

# Start the Node.js application
# ⚠️ Make sure this file exists in the dist folder
CMD ["node", "server.js"]
