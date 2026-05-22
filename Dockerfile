FROM oven/bun:latest AS dependencies

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --no-save --ignore-scripts

FROM oven/bun:latest AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN bun run build

FROM oven/bun:latest AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y unzip curl p7zip-full && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="::"
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=bun:bun /app/public ./public
RUN mkdir .next && chown bun:bun .next
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

EXPOSE 3000

CMD ["bun", "server.js"]