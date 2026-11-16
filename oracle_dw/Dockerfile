# ==============================================================================
# PINTUCO COLORLINK & ENTERPRISE ORACLE DATA WAREHOUSE DOCKERFILE
# ==============================================================================
# Soporta Node.js 20 LTS + Oracle Instant Client Basic Lite (para modo Thick/Thin)
# ==============================================================================
FROM node:20-slim AS base

# Instalar dependencias del sistema requeridas por Oracle Instant Client (libaio1)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    libaio1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo corporativo
WORKDIR /app

# Copiar definiciones de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --omit=dev || npm install --omit=dev

# Copiar código fuente
COPY . .

# Construir bundle frontend de Vite
RUN npm run build

# Crear directorio seguro para almacenamiento de archivos RAW corporativos
RUN mkdir -p /app/uploads/dw && chmod 777 /app/uploads/dw

# Exponer el puerto del servidor Express
EXPOSE 3000

# Variables por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio del servidor Full-Stack Express
CMD ["npm", "run", "start"]
