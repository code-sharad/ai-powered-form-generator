FROM node:22-slim

WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 8080
RUN npm build
CMD ["npm", "start"]