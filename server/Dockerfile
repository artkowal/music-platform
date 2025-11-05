# Użyj oficjalnego obrazu Node.js 18
FROM node:20-alpine

# Katalog roboczy w kontenerze
WORKDIR /app

# Skopiuj package.json i package-lock.json
COPY package*.json ./

# Zainstaluj zależności
RUN npm install

# Skopiuj resztę kodu aplikacji
COPY . .

# Udostępnij port, na którym działa aplikacja
EXPOSE 5000

# (używamy nodemon dla hot-reload)
CMD [ "npm", "run", "dev" ]