# Stage 1: Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files & install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the project
COPY . .

# Build Next.js app
RUN npm run build

# Stage 2: Production stage
FROM node:22-alpine
WORKDIR /app

# Copy only necessary files from build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Run production server
CMD ["npm", "start"]
