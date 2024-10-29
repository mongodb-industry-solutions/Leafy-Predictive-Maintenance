FROM node:20.10.0
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
WORKDIR /usr/src/app/client
COPY client/package*.json ./
RUN npm install
COPY client .
RUN npm run build
WORKDIR /usr/src/app
COPY . .
EXPOSE 5003
CMD ["npm", "start"]
