FROM node:20-slim

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

RUN pnpm install --no-frozen-lockfile

# Install Playwright's Chromium browser and its OS dependencies
RUN pnpm --filter @salin/web exec playwright install chromium --with-deps

WORKDIR /workspace

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN pnpm --filter @salin/web exec next build

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

CMD ["pnpm", "--filter", "@salin/web", "run", "start"]
