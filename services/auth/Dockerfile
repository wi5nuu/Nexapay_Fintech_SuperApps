FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package.json ./
RUN npm install --production=false

COPY tsconfig.json nest-cli.json ./
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl curl

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json ./
RUN npm install --production=true

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001
EXPOSE 50051

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/docs || exit 1

CMD ["node", "dist/main"]
