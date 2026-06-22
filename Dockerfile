# Dev-friendly image: ставим зависимости, генерим Prisma клиент,
# но dev-сервер запускается через volume-mount (см. docker-compose).
FROM node:20-alpine

WORKDIR /app

# Нужны для prisma и нативных бинарей
RUN apk add --no-cache libc6-compat openssl bash

# Копируем package* отдельно, чтобы кешировать установку
COPY package.json package-lock.json* ./

RUN npm install

# Копируем остальное (в dev перекроется volume mount, в prod останется здесь)
COPY . .

# Генерим Prisma клиент по схеме (если есть)
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

EXPOSE 3000

# Команда задаётся в docker-compose (entrypoint.sh)
CMD ["npm", "run", "dev"]
