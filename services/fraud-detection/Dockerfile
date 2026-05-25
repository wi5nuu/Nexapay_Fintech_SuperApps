FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/src/proto/*.proto ./dist/proto/
EXPOSE 3000
CMD ["node", "dist/main.js"]
