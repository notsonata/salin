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

RUN pnpm --filter @salin/web exec next build

ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@salin/web", "exec", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
