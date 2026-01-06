# Build stage
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Instalar Python 3 e dependências do sistema para Docling
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Criar ambiente virtual Python e instalar dependências
COPY requirements.txt ./
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Adicionar venv ao PATH
ENV PATH="/opt/venv/bin:$PATH"

# Instalar dependências Node.js de produção
COPY package*.json ./
RUN npm install --only=production

# Copiar código compilado
COPY --from=builder /app/dist ./dist

# Copiar scripts Python do Docling
COPY src/services/docling/*.py ./dist/services/docling/

# Create uploads directory
RUN mkdir -p uploads/news uploads/site uploads/courts uploads/pdfs

EXPOSE 3001

CMD ["node", "dist/index.js"]
