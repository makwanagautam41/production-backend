FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js .

RUN npm install pm2 -g

USER node

EXPOSE 5513
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
