# Stage 1: Build React / Vite SPA
FROM node:20-alpine AS builder
WORKDIR /app

# Cache package installation
COPY package.json package-lock.json ./
RUN npm ci

# Accept optional build argument for API URL (defaults to reverse-proxy path /api/v1)
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY . ./
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Remove default static assets
RUN rm -rf ./*

# Copy static assets from build stage
COPY --from=builder /app/dist ./
# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
