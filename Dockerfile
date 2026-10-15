FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_MAPBOX_ACCESS_TOKEN
ARG VITE_MAPBOX_STYLE=mapbox://styles/mapbox/standard
ENV VITE_MAPBOX_ACCESS_TOKEN=${VITE_MAPBOX_ACCESS_TOKEN}
ENV VITE_MAPBOX_STYLE=${VITE_MAPBOX_STYLE}
RUN npm run build

ARG USER_ID=10002
ARG GROUP_ID=10002
RUN addgroup -g ${GROUP_ID} -S nodejs && \
    adduser -S nodeuser -u ${USER_ID} -G nodejs && \
    chown -R nodeuser:nodejs /app

USER nodeuser

ENV WEB_PORT=8081
EXPOSE 8081

CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${WEB_PORT}"]
