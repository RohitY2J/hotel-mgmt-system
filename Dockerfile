# Stage 1: Build Angular frontend
FROM node:20.12.2 AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Build runtime image
FROM node:20.12.2-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY server ./server
COPY --from=frontend-build /app/dist ./dist
EXPOSE 8000
CMD ["node", "server/index.js"]