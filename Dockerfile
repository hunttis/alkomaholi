FROM node:carbon

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY client/package*.json ./client/
WORKDIR /usr/src/app/client
RUN npm install

WORKDIR /usr/src/app
COPY . .
WORKDIR /usr/src/app/client
RUN npm run build
WORKDIR /usr/src/app
EXPOSE 8080
CMD [ "npm", "start" ]
