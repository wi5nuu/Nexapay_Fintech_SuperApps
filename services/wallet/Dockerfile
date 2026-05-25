FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json nest-cli.json ./
RUN npm install --only=production && npm install && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache tini

WORKDIR /app

RUN addgroup -S nexapay && adduser -S nexapay -G nexapay

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN mkdir -p logs && chown -R nexapay:nexapay /app

USER nexapay

EXPOSE 3000
EXPOSE 50051

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
