FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json nest-cli.json ./
RUN npm install --only=production && npm install

COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nest

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nest

EXPOSE 3004

ENV NODE_ENV=production

CMD ["node", "dist/main"]
