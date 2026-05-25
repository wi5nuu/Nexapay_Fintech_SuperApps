FROM node:20-alpine AS builder

LABEL maintainer="NexaPay Team" \
      description="NexaPay API Gateway BFF Proxy"

WORKDIR /app

COPY package.json tsconfig.json ./
COPY src ./src

RUN npm install --only=production && \
    npm install && \
    npm run build && \
    npm prune --production

FROM node:20-alpine

RUN apk add --no-cache curl tini

WORKDIR /app

RUN addgroup -S nexapay && adduser -S nexapay -G nexapay

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

USER nexapay

EXPOSE 4000 4001

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
