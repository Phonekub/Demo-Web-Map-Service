FROM public.ecr.aws/docker/library/node:24-alpine AS build
WORKDIR /app
COPY package*.json pnpm-lock.yaml /app/
RUN apk --no-cache add curl
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install
COPY . /app/
RUN pnpm build
RUN pnpm install --prod --ignore-scripts

FROM public.ecr.aws/docker/library/node:24-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD ["node", "dist/main"]
EXPOSE 3000
