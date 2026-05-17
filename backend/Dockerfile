FROM node:20-slim
RUN apt-get update && apt-get install -y python3 make g++ libcairo2-dev libjpeg-dev libpango1.0-dev curl openssl
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
