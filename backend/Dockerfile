FROM oven/bun:latest

WORKDIR /usr/src/app
COPY package.json ./
RUN bun install
COPY . .
EXPOSE 8080
RUN bun run build
CMD ["bun", "start"]