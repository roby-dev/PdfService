FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
