# Deploy INFOSEG CORE na AWS (EC2)

## Requisitos da VM

- **Instância recomendada:** t3.medium (2 vCPU, 4GB RAM) ou maior
- **Sistema:** Ubuntu 22.04 LTS (Amazon Machine Image)
- **Armazenamento:** 30GB SSD mínimo
- **Security Group (portas):**
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 3000 (Frontend — remover depois de configurar nginx)
  - 3001 (Backend API — remover depois de configurar nginx)
  - 1433 (SQL Server — apenas se for usar na mesma VM)

---

## Passo 1: Criar a instância EC2

1. Console AWS → EC2 → Launch Instance
2. Nome: `infoseg-core`
3. AMI: Ubuntu Server 22.04 LTS
4. Tipo: t3.medium
5. Key pair: criar ou usar existente (será necessário para SSH)
6. Security Group: liberar portas 22, 80, 443
7. Storage: 30GB gp3
8. Launch

---

## Passo 2: Conectar via SSH

```bash
ssh -i "sua-chave.pem" ubuntu@SEU_IP_PUBLICO
```

---

## Passo 3: Script de setup automático

Execute este script no servidor. Ele instala tudo que precisa:

```bash
#!/bin/bash
set -e

echo "══════════════════════════════════════════════════════"
echo " INFOSEG CORE — Setup de Produção (Ubuntu 22.04)"
echo "══════════════════════════════════════════════════════"

# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar Docker + Docker Compose
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# 4. Instalar Nginx (reverse proxy)
sudo apt install -y nginx
sudo systemctl enable nginx

# 5. Instalar PM2 (process manager para Node.js)
sudo npm install -g pm2

# 6. Instalar Git
sudo apt install -y git

# 7. Criar diretório do app
sudo mkdir -p /opt/infoseg-core
sudo chown $USER:$USER /opt/infoseg-core

echo "✓ Setup base concluído!"
echo "  Node.js: $(node --version)"
echo "  Docker: $(docker --version)"
echo "  PM2: $(pm2 --version)"
```

---

## Passo 4: Subir o SQL Server via Docker

```bash
# Na VM, execute:
docker run -d \
  --name sqlserver \
  --restart unless-stopped \
  -e 'ACCEPT_EULA=Y' \
  -e 'MSSQL_SA_PASSWORD=InfoSeg@Prod2024!' \
  -p 1433:1433 \
  -v sqlserver_data:/var/opt/mssql \
  mcr.microsoft.com/mssql/server:2022-latest

# Aguardar 30s para o SQL Server iniciar
sleep 30

# Verificar se está rodando
docker logs sqlserver | tail -5
```

---

## Passo 5: Fazer deploy do código

### Opção A: Via Git (recomendado)

```bash
cd /opt/infoseg-core
git clone SEU_REPOSITORIO .
```

### Opção B: Via SCP (copiar do seu PC)

```bash
# No seu PC Windows (PowerShell):
scp -i "sua-chave.pem" -r "C:\Users\thiago PC\Documents\INFOSEG_CORE_CERTO\*" ubuntu@SEU_IP:/opt/infoseg-core/
```

---

## Passo 6: Configurar e buildar

```bash
cd /opt/infoseg-core

# Instalar dependências
npm install

# Configurar .env de produção
cat > apps/backend/.env << 'EOF'
DATABASE_URL="sqlserver://localhost:1433;database=infoseg_core;user=sa;password=InfoSeg@Prod2024!;encrypt=true;trustServerCertificate=true"
JWT_SECRET="GERE_UMA_CHAVE_FORTE_AQUI_COM_32_CHARS"
JWT_EXPIRES_IN="8h"
STORAGE_TYPE="local"
ENCRYPTION_KEY="GERE_OUTRA_CHAVE_FORTE_32_CHARS!"
MEDIAMTX_URL="http://localhost:8889"
SUPPORT_EMAIL="suporte@infoseg.com"
SUPPORT_PASSWORD="SenhaForte@Suporte2024"
PORT=3001
EOF

# Configurar .env do frontend
cat > apps/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://SEU_IP_OU_DOMINIO:3001
NEXT_PUBLIC_WS_URL=http://SEU_IP_OU_DOMINIO:3001
NEXT_PUBLIC_MEDIAMTX_URL=http://SEU_IP_OU_DOMINIO:8889
EOF

# Build do shared package
npx tsc --project packages/shared/tsconfig.json

# Gerar Prisma Client
cd apps/backend
npx prisma generate

# Criar banco de dados (executar o SQL)
# Conecte no SQL Server e rode o create-database.sql
# Ou use prisma:
npx prisma db push
cd ../..

# Build do backend
cd apps/backend
npx nest build
cd ../..

# Build do frontend
cd apps/frontend
npm run build
cd ../..
```

---

## Passo 7: Criar o banco de dados

```bash
# Instalar sqlcmd no Ubuntu
curl https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc
echo "deb [arch=amd64] https://packages.microsoft.com/ubuntu/22.04/prod jammy main" | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt update
sudo ACCEPT_EULA=Y apt install -y mssql-tools18 unixodbc-dev

# Executar script de criação
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'InfoSeg@Prod2024!' -C -i /opt/infoseg-core/apps/backend/prisma/create-database.sql
```

---

## Passo 8: Iniciar com PM2

```bash
cd /opt/infoseg-core

# Criar ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'infoseg-backend',
      script: 'apps/backend/dist/main.js',
      cwd: '/opt/infoseg-core',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'infoseg-frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/opt/infoseg-core/apps/frontend',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
};
EOF

# Iniciar
pm2 start ecosystem.config.js

# Salvar para auto-start no boot
pm2 save
pm2 startup
# Copie e execute o comando que o PM2 mostrar
```

---

## Passo 9: Configurar Nginx (reverse proxy)

```bash
sudo tee /etc/nginx/sites-available/infoseg << 'EOF'
server {
    listen 80;
    server_name SEU_DOMINIO_OU_IP;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /auth/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /resident/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /visitor/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /concierge/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket (Socket.io)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Upload size limit (for visitor photos)
    client_max_body_size 12M;
}
EOF

# Ativar o site
sudo ln -sf /etc/nginx/sites-available/infoseg /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

---

## Passo 10: Configurar HTTPS com Let's Encrypt (opcional mas recomendado)

```bash
# Só funciona se tiver um domínio apontando para o IP
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

---

## Passo 11: Atualizar as URLs para produção

Após o nginx estar configurado, atualize o `.env.local` do frontend:

```bash
cat > /opt/infoseg-core/apps/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://seudominio.com
NEXT_PUBLIC_WS_URL=https://seudominio.com
NEXT_PUBLIC_MEDIAMTX_URL=https://seudominio.com:8889
EOF

# Rebuild frontend com URLs corretas
cd /opt/infoseg-core/apps/frontend
npm run build

# Reiniciar
pm2 restart all
```

---

## Comandos úteis de manutenção

```bash
# Ver status dos processos
pm2 status

# Ver logs em tempo real
pm2 logs

# Reiniciar tudo
pm2 restart all

# Ver logs do backend
pm2 logs infoseg-backend --lines 50

# Ver logs do frontend
pm2 logs infoseg-frontend --lines 50

# Ver status do SQL Server
docker logs sqlserver --tail 20

# Atualizar código (após git pull)
cd /opt/infoseg-core
git pull
npx tsc --project packages/shared/tsconfig.json
cd apps/backend && npx nest build && cd ..
cd apps/frontend && npm run build && cd ..
pm2 restart all
```

---

## Resumo da arquitetura em produção

```
Internet → Nginx (:80/:443)
            ├── / → Next.js (:3000) — Frontend
            ├── /auth, /resident, /visitor, /concierge, /admin → NestJS (:3001) — API
            └── /socket.io → NestJS (:3001) — WebSocket

NestJS → SQL Server (Docker :1433) — Banco de dados
```

---

## Credenciais padrão após deploy

| Perfil | Email | Senha |
|--------|-------|-------|
| Suporte | suporte@infoseg.com | (definida no .env) |
| Porteiro | porteiro@infoseg.com | porteiro123 |
| Morador | maria@morador.com | morador123 |

**⚠️ Troque TODAS as senhas padrão em produção!**
