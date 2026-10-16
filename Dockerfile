FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=npm_ca if [ -f /run/secrets/npm_ca ]; then npm ci --no-audit --no-fund --cafile /run/secrets/npm_ca; else npm ci --no-audit --no-fund; fi
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production NODE_USE_ENV_PROXY=1
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN --mount=type=secret,id=npm_ca if [ -f /run/secrets/npm_ca ]; then npm ci --omit=dev --no-audit --no-fund --cafile /run/secrets/npm_ca; else npm ci --omit=dev --no-audit --no-fund; fi && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server ./server
COPY --chown=node:node src/audit.js src/checklist.json ./src/
RUN mkdir -p /var/data && chown node:node /var/data
USER node
EXPOSE 3000
CMD ["node","server/index.js"]
