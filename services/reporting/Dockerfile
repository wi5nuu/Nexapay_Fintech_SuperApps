FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production && cp -R node_modules /tmp/node_modules_prod
RUN npm install

COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /usr/src/app

RUN apk add --no-cache tini

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /tmp/node_modules_prod ./node_modules
COPY package*.json ./

USER node

EXPOSE 4007

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
