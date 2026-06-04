# Build estático (Create React App)
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Servir (HTTP local ou HTTPS em produção via entrypoint)
FROM nginx:1.27-alpine
RUN apk add --no-cache gettext

COPY --from=build /app/build /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.dev.conf
COPY docker/nginx.http-bootstrap.conf /etc/nginx/nginx.http-bootstrap.conf
COPY docker/nginx.ssl.conf.template /etc/nginx/nginx.ssl.conf.template
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443
ENTRYPOINT ["/entrypoint.sh"]
