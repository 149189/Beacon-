FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install \
    && npm install -g nodemon

COPY . .

EXPOSE 9000

CMD ["nodemon", "--legacy-watch", "server.js"]
