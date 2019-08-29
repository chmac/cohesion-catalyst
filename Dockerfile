FROM node:0.10

WORKDIR /app

COPY . /app

WORKDIR /app/programs/server

RUN npm install

WORKDIR /app

EXPOSE 3000

ENV MONGO_URL "mongodb://mongo:27017"
ENV ROOT_URL "http://localhost:3000"

CMD ["node", "main.js"]
