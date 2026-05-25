FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json nest-cli.json ./
COPY prisma ./prisma

RUN npm install

COPY src ./src

RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
EXPOSE 50051

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main"]
