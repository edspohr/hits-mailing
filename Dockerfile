# Usamos una imagen ligera de Node
FROM node:20-alpine

# Directorio de trabajo principal
WORKDIR /app

# --- 1. BUILD DEL FRONTEND ---
# Copiamos dependencias web
COPY client/package*.json ./client/
# Instalamos
RUN cd client && npm install
# Copiamos todo el código fuente web
COPY client/ ./client/
# Construimos (Genera /app/client/dist)
RUN cd client && npm run build

# --- 2. SETUP DEL BACKEND ---
# Copiamos dependencias servidor
COPY server/package*.json ./server/
# Instalamos (Solo producción)
RUN cd server && npm install --production
# Copiamos el código del servidor
COPY server/ ./server/

# Configuración de Entorno
# El servidor usará process.env.PORT inyectado por Railway


# Iniciamos el "Monolito"
CMD ["node", "server/index.js"]
