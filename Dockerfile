FROM gitlab.geosemantica.ru:5050/achetut/ui/node:20-alpine

# Нет global! Всё local.
WORKDIR /app

# Копируем и install (под root, но chown после)
COPY package*.json ./
RUN npm ci --only=production=false  # ci для lockfile, full deps
RUN npx expo install --fix  # Фиксит Expo mismatches

COPY . .

# Non-root с uid
ARG USER_ID=10002
ARG GROUP_ID=10002
RUN addgroup -g ${GROUP_ID} -S nodejs && \
    adduser -S nodeuser -u ${USER_ID} -G nodejs
RUN chown -R nodeuser:nodejs /app  # Всё /app теперь non-root (включая node_modules после install)
USER nodeuser

EXPOSE $EXPOSE_PORTS

CMD sh -c "echo $EXPO_TOKEN | npx expo login --non-interactive && npx expo start --tunnel --port $EXPO_WEB_PORT --clear"