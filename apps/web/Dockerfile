FROM node:20-alpine

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --no-frozen-lockfile

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /workspace/apps/web

RUN pnpm build

CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
