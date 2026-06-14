FROM node:20-alpine

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

RUN pnpm install --no-frozen-lockfile

WORKDIR /workspace

RUN pnpm --filter @salin/web exec next build

CMD ["pnpm", "--filter", "@salin/web", "exec", "next", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
