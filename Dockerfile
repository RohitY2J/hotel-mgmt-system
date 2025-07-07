# Stage 2: Build runtime image
FROM node:20.12.2-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY server ./server
COPY dist ./dist
COPY env ./env
EXPOSE 8000
CMD ["node", "server/index.js"]