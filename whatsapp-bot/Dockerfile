FROM node:20-alpine

WORKDIR /app

# Install dependencies for Baileys
RUN apk add --no-cache python3 make g++ git

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
