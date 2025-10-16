FROM node:22-slim 

WORKDIR /usr/src/app
COPY package*.json ./
RUN bun install
COPY . .
EXPOSE 8080
RUN bun build
CMD ["bun", "start"]