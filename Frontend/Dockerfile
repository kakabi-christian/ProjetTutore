# On reste sur Node 20
FROM node:24-alpine

WORKDIR /app

# On installe les dépendances
COPY package*.json ./
RUN npm install

# On copie le reste du projet
COPY . .

# On expose le port interne de Vite
EXPOSE 5173

# On lance le serveur de développement
# Le --host 0.0.0.0 est CRUCIAL ici aussi
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]