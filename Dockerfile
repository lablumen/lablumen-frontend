FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# When proxied through nginx, the frontend calls relative /api/v1/... URLs.
# Leave VITE_*_API empty so api.ts falls through to the relative default.
ARG VITE_APPOINTMENT_API=""
ARG VITE_REPORT_API=""
ARG VITE_COGNITO_USER_POOL_ID=""
ARG VITE_COGNITO_APP_CLIENT_ID=""
ARG VITE_COGNITO_DOMAIN=""

ENV VITE_APPOINTMENT_API=$VITE_APPOINTMENT_API
ENV VITE_REPORT_API=$VITE_REPORT_API
ENV VITE_COGNITO_USER_POOL_ID=__VITE_COGNITO_USER_POOL_ID__
ENV VITE_COGNITO_APP_CLIENT_ID=__VITE_COGNITO_APP_CLIENT_ID__
ENV VITE_COGNITO_DOMAIN=$VITE_COGNITO_DOMAIN

RUN npm run build

FROM nginx:1.27-alpine
RUN apk update && apk upgrade --no-cache
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY inject-env.sh /docker-entrypoint.d/40-inject-env.sh
RUN chmod +x /docker-entrypoint.d/40-inject-env.sh
EXPOSE 80
