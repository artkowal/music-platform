FROM node:20-alpine

WORKDIR /app

# Kopiujemy najpierw package.json, aby skorzystać z cache'owania warstw Dockera
COPY package*.json ./
RUN npm install

# Kopiujemy resztę plików
COPY . .

# Port 5173
EXPOSE 5173

# Komenda startowa
CMD ["npm", "run", "dev"]