FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --only=production && npm cache clean --force

RUN npm install && npx prisma generate

COPY tsconfig.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

RUN addgroup -S nest && adduser -S nest -G nest

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

USER nest

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
