# Agentic Leads - Guia Rapido

Projeto consolidado em um unico app na raiz, sem dependencia da pasta legada next-firebase-starter.

## Stack atual

- API: Express + TypeScript ([src/index.ts](src/index.ts))
- Frontend: Next.js (Pages Router em [pages](pages))
- Banco: PostgreSQL
- Cache: Redis
- Orquestracao: n8n

## Pre-requisitos

- Node.js 20+
- Docker e Docker Compose

## Subir ambiente local

1. Instalar dependencias

```bash
npm install
```

2. Subir infraestrutura

```bash
docker-compose up -d
```

3. Rodar API

```bash
npm run dev:api
```

4. Rodar frontend (em outro terminal)

```bash
PORT=8010 npx next dev
```

## Endpoints uteis

- API health: http://localhost:3000/health
- Listar leads: http://localhost:3000/api/leads
- Criar lead: POST http://localhost:3000/api/leads
- Frontend: http://localhost:8010

## Scripts principais

```bash
npm run dev:api      # API com watch
npm run dev:n8n      # n8n
npm run build        # build TypeScript da API
npm run start        # executa API compilada
npm run db:migrate   # migracoes
npm run db:seed      # seed
npm run test         # testes
```

## Observacoes

- O frontend consome a API em http://localhost:3000 por padrao em [pages/leads.js](pages/leads.js).
- Para trocar endpoint no frontend, defina NEXT_PUBLIC_API_BASE_URL.
