FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json yarn.lock* package-lock.json* ./
RUN npm install --only=production || npm install

COPY tsconfig.json nest-cli.json ./
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /usr/src/app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma

USER nestjs

EXPOSE 3004

ENV NODE_ENV=production

CMD ["node", "dist/main"]
