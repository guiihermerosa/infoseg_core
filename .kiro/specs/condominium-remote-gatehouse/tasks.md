# Implementation Plan: INFOSEG CORE — Portaria Remota de Condomínios

## Overview

Plano de implementação incremental para o sistema de portaria remota, organizado em 16 blocos de tarefas que seguem a ordem lógica de dependências: infraestrutura → shared → backend (schema, auth, módulos de domínio) → frontend (setup, auth, painéis) → infrastructure → testes. Cada tarefa é autocontida e constrói sobre as anteriores.

## Tasks

- [x] 1. Setup do monorepo e configurações base
  - [x] 1.1 Inicializar monorepo com workspaces
    - Criar `package.json` raiz com workspaces: `packages/*`, `apps/*`, `infrastructure/*`
    - Instalar Turborepo como dev dependency e criar `turbo.json` com pipelines (build, dev, lint, test)
    - Criar `tsconfig.base.json` com `strict: true`, paths aliases para `@infoseg/shared`
    - Criar `.env.example` com variáveis: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `STORAGE_TYPE`, `MEDIAMTX_URL`
    - Criar `.gitignore` cobrindo `node_modules`, `.env`, `dist`, `.next`, `prisma/migrations`
    - _Requirements: 12.1_

  - [x] 1.2 Configurar ESLint e Prettier para o monorepo
    - Instalar e configurar ESLint com plugins TypeScript no root
    - Criar `.prettierrc` com configuração consistente (singleQuote, trailingComma, semi)
    - Adicionar scripts `lint` e `format` no package.json raiz
    - _Requirements: 14.6_

- [x] 2. Pacote shared (tipos, DTOs, enums)
  - [x] 2.1 Criar estrutura do pacote shared
    - Criar `packages/shared/package.json` com `name: @infoseg/shared` e exports map
    - Criar `packages/shared/tsconfig.json` herdando do base
    - Criar barril `packages/shared/src/index.ts`
    - _Requirements: 12.1_

  - [x] 2.2 Implementar enums e constantes
    - Criar `packages/shared/src/enums/visit-status.enum.ts` — `PENDING`, `APPROVED`, `DENIED`
    - Criar `packages/shared/src/enums/user-type.enum.ts` — `RESIDENT`, `VISITOR`, `CONCIERGE`
    - Criar `packages/shared/src/enums/ptz-command.enum.ts` — `UP`, `DOWN`, `LEFT`, `RIGHT`, `ZOOM_IN`, `ZOOM_OUT`
    - Criar `packages/shared/src/constants/index.ts` — limites de campos, timeouts (rate limit: 5 tentativas/15min, JWT: 8h), regex de validação (IPv4, CPF, UUID v4)
    - _Requirements: 1.3, 8.2, 12.6, 12.7_

  - [x] 2.3 Implementar DTOs compartilhados
    - Criar DTOs de auth: `LoginDto`, `ForgotPasswordDto`, `ResetPasswordDto`, `LoginResponseDto`
    - Criar DTOs de resident: `DashboardResponseDto`, `InviteLinkResponseDto`, `InviteListResponseDto`, `CreateInviteDto`
    - Criar DTOs de visitor: `InviteStatusDto`, `RegisterVisitorDto`, `RegisterResponseDto`
    - Criar DTOs de concierge: `ActionRequestDto`, `ActionResponseDto`, `PendingVisitorListDto`, `ResidentListDto`
    - Criar DTOs de camera: `CameraDto`, `CameraListDto`, `CameraCreateDto`, `CameraUpdateDto`, `StreamResponseDto`, `PtzCommandDto`
    - _Requirements: 2.1, 3.1, 4.1, 7.1, 9.2, 11.1_

  - [x] 2.4 Implementar tipagem de eventos WebSocket
    - Criar `packages/shared/src/events/index.ts` com interfaces para cada evento: `VisitorRegisteredEvent`, `VisitApprovedEvent`, `VisitDeniedEvent`, `GateOpenedEvent`, `CameraOfflineEvent`, `CameraOnlineEvent`, `PanicAlertEvent`, `IntercomCallEvent`, `IntercomMissedEvent`, `AccessLogUpdatedEvent`
    - Definir constantes de nomes de eventos e rooms (`resident:{id}`, `concierge:all`)
    - _Requirements: 5.2, 5.3, 7.7, 9.3, 9.4, 10.1_

- [x] 3. Backend: Prisma schema + migrações
  - [x] 3.1 Setup do app NestJS e PrismaModule
    - Criar `apps/backend/package.json` com dependências NestJS core (@nestjs/core, @nestjs/common, @nestjs/platform-express)
    - Criar `apps/backend/tsconfig.json` herdando do base
    - Instalar Prisma CLI e @prisma/client como dependências
    - Criar `apps/backend/src/prisma/prisma.module.ts` (Global module)
    - Criar `apps/backend/src/prisma/prisma.service.ts` — extends PrismaClient, implements OnModuleInit/OnModuleDestroy, connection pooling, soft shutdown hooks
    - _Requirements: 12.1_

  - [x] 3.2 Criar Prisma schema com todas as tabelas
    - Criar `apps/backend/prisma/schema.prisma` com datasource sqlserver e generator client
    - Definir model `Resident` com campos: id (uuid), name (NVarChar 150), apartment_number, block, phone, email (unique), password_hash, created_at, updated_at; índices em email e (apartment_number, block)
    - Definir model `Visitor` com campos: id (uuid), name (NVarChar 150), document (NVarChar 30), face_encoding_url (NVarChar 500 optional), created_at; índice em document
    - Definir model `Visit` com campos: id (uuid), resident_id (FK), visitor_id (FK optional), status (enum VisitStatus), visit_date, valid_until, invite_link_token (unique NVarChar 255), visitor_name (NVarChar 150), created_at, updated_at; índices em resident_id, invite_link_token, (status, valid_until)
    - Definir model `AccessLog` com campos: id (uuid), user_id, user_type (enum UserType), action_type (NVarChar 50), access_point (NVarChar 100), details (NVarChar 500 optional), timestamp; índices em timestamp e (user_type, user_id)
    - Definir model `Camera` com campos: id (uuid), name (NVarChar 100), ip_address (NVarChar 45), onvif_port (Int), rtsp_port (Int), username (NVarChar 50), password (NVarChar 128), ptz_supported (Boolean), location_zone (NVarChar 100), is_online (Boolean), created_at, updated_at; unique constraint em (ip_address, onvif_port); índice em ip_address
    - Definir model `Concierge` com campos: id (uuid), name (NVarChar 150), email (unique NVarChar 255), phone (NVarChar 20), password_hash (NVarChar 255), created_at, updated_at; índice em email
    - Definir enums `VisitStatus` (PENDING, APPROVED, DENIED) e `UserType` (RESIDENT, VISITOR, CONCIERGE) com `@map` para valores lowercase
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6, 12.7_

  - [x] 3.3 Criar middleware Prisma para criptografia de campos sensíveis
    - Criar `apps/backend/src/prisma/prisma.middleware.ts` com middleware de criptografia transparente para campos sensíveis (phone, email, document, face_encoding_url)
    - Usar AES-256-GCM para criptografia/descriptografia com chave via env `ENCRYPTION_KEY`
    - Aplicar middleware no PrismaService via `$use()` para encrypt no write e decrypt no read
    - _Requirements: 14.7_

  - [x] 3.4 Gerar e executar migração inicial
    - Executar `npx prisma migrate dev --name init` para gerar e aplicar migração
    - Verificar que todas as tabelas, índices e constraints foram criados corretamente
    - Criar seed script (`apps/backend/prisma/seed.ts`) com dados de teste: 1 concierge, 2 residents, 1 visitor
    - _Requirements: 12.5_

  - [ ]* 3.5 Write property tests para schema e criptografia
    - **Property 30: Dados pessoais sensíveis cifrados em repouso**
    - **Validates: Requirements 14.7**

- [x] 4. Backend: AuthModule (login, JWT, bcrypt, rate limiting, recuperação de senha)
  - [x] 4.1 Implementar AuthModule base com JWT
    - Criar `apps/backend/src/auth/auth.module.ts` importando JwtModule (8h expiração), PassportModule
    - Criar `apps/backend/src/auth/auth.service.ts` — login (validar email, bcrypt.compare, gerar JWT com sub e role), findUserByEmail (busca em Resident e Concierge)
    - Criar `apps/backend/src/auth/auth.controller.ts` — `POST /auth/login` recebe `{email, password}`, retorna `{access_token}`
    - Criar `apps/backend/src/auth/strategies/jwt.strategy.ts` — extrai JWT do header Authorization, valida e injeta payload no request
    - Criar `apps/backend/src/auth/dto/login.dto.ts` e `login-response.dto.ts` com class-validator decorators
    - _Requirements: 1.1, 1.6_

  - [x] 4.2 Implementar Guards de autenticação e autorização
    - Criar `apps/backend/src/auth/guards/jwt-auth.guard.ts` — extends AuthGuard('jwt'), retorna 401 para token inválido/expirado
    - Criar `apps/backend/src/auth/guards/roles.guard.ts` — verifica `@Roles()` decorator contra `request.user.role`, retorna 403 se não autorizado
    - Criar `apps/backend/src/common/decorators/roles.decorator.ts` — `@Roles('concierge', 'resident')` decorator customizado
    - _Requirements: 1.4, 1.5_

  - [x] 4.3 Implementar Rate Limiting
    - Instalar `@nestjs/throttler` ou implementar rate limiter customizado em memória
    - Criar rate limit por email: 5 tentativas/15 minutos com bloqueio de 15 minutos após exceder
    - Criar rate limit por IP: 10 tentativas/15 minutos
    - Retornar HTTP 429 com mensagem de tempo restante de bloqueio e header `Retry-After`
    - Incrementar contador de falhas em login incorreto, resetar em login bem-sucedido
    - _Requirements: 1.2, 1.3, 14.5_

  - [x] 4.4 Implementar recuperação de senha
    - Criar `POST /auth/forgot-password` — gera token de uso único (UUID v4), salva com validade 30min, envia email (via serviço de email injetável/mockável)
    - Criar `POST /auth/reset-password` — valida token (não expirado, não usado), atualiza password_hash com bcrypt cost 12, marca token como usado
    - Retornar mesma mensagem genérica para email válido e inválido no forgot-password
    - Retornar HTTP 400 para token expirado ou já utilizado no reset-password
    - _Requirements: 1.7, 1.8, 1.9_

  - [x] 4.5 Criar filtro global de exceções e ValidationPipe
    - Criar `apps/backend/src/common/filters/http-exception.filter.ts` — formato padrão: `{statusCode, message, error, details, timestamp, path}`
    - Criar `apps/backend/src/common/pipes/validation.pipe.ts` — ValidationPipe global com whitelist, forbidNonWhitelisted, transform
    - Registrar filtro e pipe globalmente no `main.ts`
    - _Requirements: 1.2, 14.6_

  - [ ]* 4.6 Write property tests para AuthModule
    - **Property 1: JWT contém perfil e identificador corretos**
    - **Property 2: Respostas de erro de autenticação não vazam informação**
    - **Property 3: Rate limiting bloqueia após N tentativas**
    - **Property 4: JWT inválido é sempre rejeitado**
    - **Property 5: Senhas armazenadas com bcrypt cost ≥ 12**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.8, 14.5**

- [x] 5. Backend: ResidentModule (dashboard, invites, aprovação/recusa)
  - [x] 5.1 Implementar ResidentModule com dashboard
    - Criar `apps/backend/src/resident/resident.module.ts` importando PrismaModule, EventsModule
    - Criar `apps/backend/src/resident/resident.service.ts` — método `getDashboard(residentId)`: consulta Visits dos últimos 7 dias agrupando por status (approved/denied/pending), consulta últimos 20 AccessLogs vinculados à unidade, retorna totais + logs ordenados por timestamp desc
    - Criar `apps/backend/src/resident/resident.controller.ts` — `GET /resident/dashboard` protegido por JwtAuthGuard + RolesGuard('resident')
    - _Requirements: 2.1, 2.4_

  - [x] 5.2 Implementar geração de convites (Invite Link)
    - Criar método `createInvite(residentId, dto)` no resident.service — valida visitor_name (1-100 chars), valida valid_until (>= agora + 1min), gera UUID v4 como token, cria Visit com status PENDING
    - Criar `POST /resident/invite` no controller — retorna `{invite_link, token, visit_id}`
    - Criar `GET /resident/invites` no controller — lista invites do morador ordenados por created_at desc, paginados
    - Validar inputs com class-validator: retornar HTTP 422 para campos inválidos com mensagem detalhada
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

  - [x] 5.3 Implementar aprovação/recusa de visitante
    - Criar método `approveVisit(residentId, visitId)` — valida que visit pertence ao resident e status é PENDING, atualiza para APPROVED, cria AccessLog, emite evento `visit_approved` via EventsModule
    - Criar método `denyVisit(residentId, visitId)` — valida que visit pertence ao resident e status é PENDING, atualiza para DENIED, cria AccessLog, emite evento `visit_denied` via EventsModule
    - Criar `POST /resident/visit/:id/approve` e `POST /resident/visit/:id/deny` no controller
    - Emitir evento `access_log_updated` para room `resident:{id}` após criar AccessLog
    - _Requirements: 5.2, 5.3, 5.6_

  - [ ]* 5.4 Write property tests para ResidentModule
    - **Property 6: Dashboard filtra apenas últimos 7 dias e ordena corretamente**
    - **Property 7: Token de invite é UUID v4 válido e único**
    - **Property 9: Lista de invites ordenada por data decrescente**
    - **Property 10: Validação de input do invite rejeita dados inválidos**
    - **Property 13: Decisão do morador transiciona status e emite evento correto**
    - **Validates: Requirements 2.1, 3.1, 3.2, 3.5, 3.6, 5.2, 5.3, 5.6**

- [x] 6. Backend: VisitorModule (validação token, registro, upload foto)
  - [x] 6.1 Implementar StorageModule
    - Criar `apps/backend/src/storage/storage.module.ts` com provider condicional baseado em `STORAGE_TYPE` env
    - Criar `apps/backend/src/storage/storage.service.ts` — interface abstrata: `upload(file, filename, mimetype): Promise<string>`, `getSignedUrl(key, expiresIn)`, `delete(key)`
    - Criar `apps/backend/src/storage/local-storage.service.ts` — implementação local para dev (salva em `./uploads/`)
    - Criar `apps/backend/src/storage/azure-blob-storage.service.ts` — stub para produção
    - _Requirements: 4.3, 14.4_

  - [x] 6.2 Implementar VisitorModule com validação de token
    - Criar `apps/backend/src/visitor/visitor.module.ts` importando PrismaModule, StorageModule, EventsModule
    - Criar `apps/backend/src/visitor/visitor.service.ts` — método `validateInviteToken(token)`: busca Visit por invite_link_token, verifica se status é PENDING (senão 409), verifica se valid_until > now (senão 410)
    - Criar `apps/backend/src/visitor/visitor.controller.ts` — `GET /visitor/invite/:token` retorna status do invite
    - _Requirements: 3.3, 3.4_

  - [x] 6.3 Implementar registro de visitante com upload de foto
    - Criar método `registerVisitor(dto)` no visitor.service — valida nome (>= 3 chars, <= 120), valida documento (CPF 11 dígitos com checksum ou RG 5-14 alfanumérico), valida foto (formato JPEG/PNG/WebP, tamanho <= 10MB)
    - Upload da foto via StorageModule, obtém URL
    - Criar/atualizar registro Visitor com face_encoding_url
    - Vincular visitor_id ao Visit correspondente (manter status PENDING)
    - Emitir evento `visitor_registered` para room `resident:{residentId}` com nome e thumbnail URL
    - Criar `POST /visitor/register` como endpoint multipart (usar @UseInterceptors(FileInterceptor))
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.9_

  - [ ]* 6.4 Write property tests para VisitorModule
    - **Property 8: Invite não-válido é rejeitado com código correto**
    - **Property 11: Validação de dados do visitante**
    - **Property 12: Registro vincula visitante ao invite mantendo status pending**
    - **Validates: Requirements 3.3, 3.4, 4.2, 4.4, 4.8**

- [x] 7. Backend: ConciergeModule (ações rápidas)
  - [x] 7.1 Implementar ConciergeModule
    - Criar `apps/backend/src/concierge/concierge.module.ts` importando PrismaModule, EventsModule
    - Criar `apps/backend/src/concierge/concierge.service.ts` — método `executeAction(conciergeId, dto)`: aceita tipos de ação (open_main_gate, open_block_door, entry_release, call_resident, panic), comunica com controlador físico (interface abstrata), cria AccessLog para cada ação
    - Criar `apps/backend/src/concierge/concierge.controller.ts` — `POST /concierge/action` protegido por RolesGuard('concierge')
    - Implementar lógica de `entry_release`: busca visitante pending, atualiza status para APPROVED, cria AccessLog tipo `entry_release`, emite `gate_opened`
    - Implementar lógica de `panic`: emite `panic_alert` para todos, cria AccessLog tipo `panic`
    - Implementar lógica de `call_resident`: emite `intercom_call` para room do morador selecionado
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8_

  - [x] 7.2 Implementar endpoints auxiliares do porteiro
    - Criar `GET /concierge/visitors/pending` — lista visitantes com status PENDING
    - Criar `GET /concierge/residents` — lista moradores do condomínio para seleção
    - Retornar HTTP 503 se comunicação com controlador físico falhar ou timeout > 3s
    - _Requirements: 9.6, 9.7, 9.8_

  - [ ]* 7.3 Write property tests para ConciergeModule
    - **Property 19: Toda ação do porteiro gera AccessLog**
    - **Property 20: Pânico emite panic_alert para todos**
    - **Property 21: Liberar entrada atualiza status e emite evento**
    - **Validates: Requirements 9.4, 9.5, 9.7**

- [x] 8. Backend: CameraModule (CRUD, stream, PTZ, health)
  - [x] 8.1 Implementar CameraModule com CRUD
    - Criar `apps/backend/src/camera/camera.module.ts` importando PrismaModule, EventsModule
    - Criar `apps/backend/src/camera/camera.service.ts` — CRUD completo de câmeras com validação: name <= 100 chars, ip_address formato IPv4, onvif_port e rtsp_port entre 1-65535, username <= 50, password <= 128
    - Teste de conexão ONVIF via node-onvif no create/update com timeout de 5s, retornando `connection_status`
    - Nunca expor username/password em responses — excluir no select do Prisma
    - Rejeitar duplicidade de (ip_address, onvif_port) com mensagem de erro
    - Criar `GET /concierge/cameras`, `POST /concierge/cameras`, `PUT /concierge/cameras/:id`, `DELETE /concierge/cameras/:id`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 8.2 Implementar streaming de câmeras via MediaMTX
    - Criar `GET /concierge/cameras/:id/stream` — gera URL de stream no formato `/cam-{id}` com protocolo `whep`
    - Integrar com API do MediaMTX para registrar/verificar path da câmera
    - Montar source URL: `rtsp://{username}:{password}@{ip}:{rtsp_port}/stream`
    - Configurar `sourceOnDemand: yes` para pull sob demanda
    - Retornar `{stream_url, protocol}` para o cliente
    - _Requirements: 7.4, 7.6_

  - [x] 8.3 Implementar controle PTZ via node-onvif
    - Criar `apps/backend/src/camera/camera-ptz.service.ts` — mapeia comandos (up, down, left, right, zoom_in, zoom_out) para velocidades ONVIF
    - Implementar `POST /concierge/cameras/:id/ptz` com validação de comando
    - Para movimentos direcionais: continuousMove + stop após 300ms (passo discreto)
    - Retornar HTTP 502 com tipo de falha se timeout > 5s ou conexão recusada
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 8.4 Implementar health monitoring de câmeras
    - Criar `apps/backend/src/camera/camera-health.service.ts` — verifica heartbeat de cada câmera a cada 10s
    - Se heartbeat ausente > 10s: marcar como offline no banco, emitir `camera_offline` via WebSocket
    - Quando heartbeat restabelecido: marcar como online, emitir `camera_online`
    - _Requirements: 7.7, 7.8_

  - [ ]* 8.5 Write property tests para CameraModule
    - **Property 15: Grid de câmeras respeita limite do layout**
    - **Property 16: Câmera sem heartbeat > 10s é marcada offline**
    - **Property 17: Visibilidade do overlay PTZ é determinada pela flag ptz_supported**
    - **Property 18: Mapeamento de comandos PTZ**
    - **Property 26: Validação de campos de câmera**
    - **Property 27: Credenciais de câmera nunca expostas em responses**
    - **Property 28: Unicidade de ip_address + onvif_port**
    - **Validates: Requirements 7.3, 7.7, 8.1, 8.2, 8.3, 8.4, 11.1, 11.3, 11.4, 11.5, 11.6**

- [x] 9. Backend: EventsModule (WebSocket gateway, rooms, catch-up)
  - [x] 9.1 Implementar EventsModule (WebSocket Gateway)
    - Criar `apps/backend/src/events/events.module.ts`
    - Criar `apps/backend/src/events/events.gateway.ts` — `@WebSocketGateway` com namespace `/`, transports: ['websocket'], autenticação JWT no handshake (extrair token de `client.handshake.auth.token`), atribuir client à room baseado no role (resident:{id} ou concierge:all)
    - Criar `apps/backend/src/events/events.service.ts` — métodos para emitir eventos segmentados por room: `emitToResident(residentId, event, payload)`, `emitToConcierge(event, payload)`, `emitToAll(event, payload)`
    - Armazenar últimos 100 eventos em buffer (memória) para catch-up
    - _Requirements: 10.1, 10.4_

  - [x] 9.2 Implementar catch-up e reconexão
    - Implementar handler para evento `sync_events` do cliente: recebe `{last_event_id, limit}`, retorna eventos após o ID informado (limitado a 100)
    - Cada evento emitido recebe um UUID como event_id e timestamp para ordenação
    - Responder com `sync_events_response` contendo array de eventos perdidos
    - _Requirements: 10.5_

  - [ ]* 9.3 Write property tests para EventsModule
    - **Property 23: Feed limitado a 100 entradas**
    - **Property 24: Backoff exponencial de reconexão**
    - **Property 25: Catch-up sem duplicatas**
    - **Validates: Requirements 10.3, 10.4, 10.5**

- [x] 10. Checkpoint Backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend: Setup Next.js + Tailwind + Shadcn UI
  - [x] 11.1 Inicializar app Next.js 14 com App Router
    - Criar `apps/frontend/package.json` com Next.js 14, React 18, TypeScript
    - Configurar `apps/frontend/next.config.js` com output standalone, env vars públicas
    - Configurar `apps/frontend/tsconfig.json` com paths para `@infoseg/shared` e `@/` alias local
    - _Requirements: 13.1_

  - [x] 11.2 Configurar Tailwind CSS + Shadcn UI
    - Instalar e configurar Tailwind CSS com `tailwind.config.ts` — paleta: primary green (#16A34A), background white (#FFFFFF), border gray (#E5E7EB)
    - Configurar tipografia Inter/Roboto com font-size mínimo 14px desktop / 16px mobile
    - Inicializar Shadcn UI com componentes base: Button, Card, Input, Label, Dialog, Toast, Table, Badge, Select, Tabs
    - Criar `apps/frontend/src/styles/globals.css` com Tailwind directives e CSS variables Shadcn
    - _Requirements: 13.1, 13.2_

  - [x] 11.3 Criar lib de API e autenticação
    - Criar `apps/frontend/src/lib/api.ts` — wrapper fetch/axios com baseURL, interceptor para JWT no header Authorization, handler de 401 (redirect para login)
    - Criar `apps/frontend/src/lib/auth.ts` — helpers para armazenar/recuperar/remover JWT de localStorage, verificar expiração
    - Criar `apps/frontend/src/lib/socket.ts` — configuração Socket.io client com auth token, reconnection com backoff exponencial (1s→30s), transports: ['websocket']
    - _Requirements: 1.1, 10.4, 14.1_

  - [x] 11.4 Criar hooks reutilizáveis
    - Criar `apps/frontend/src/hooks/useSocket.ts` — conexão Socket.io com auto-reconnect, status indicator (conectado/reconectando/desconectado), catch-up automático ao reconectar
    - Criar `apps/frontend/src/hooks/useAuth.ts` — login, logout, verificação de role, redirect
    - _Requirements: 10.4, 10.5_

- [x] 12. Frontend: Layout e páginas de auth (login)
  - [x] 12.1 Criar layout de autenticação e página de login
    - Criar `apps/frontend/src/app/(auth)/layout.tsx` — layout centralizado sem sidebar
    - Criar `apps/frontend/src/app/(auth)/login/page.tsx` — formulário com email + password, validação client-side, submit para POST /auth/login, armazenar JWT, redirect baseado no role (resident → /dashboard, concierge → /cameras)
    - Exibir mensagem genérica em caso de erro (401), exibir tempo de bloqueio em caso de rate limit (429)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 12.2 Criar middleware de proteção de rotas
    - Criar `apps/frontend/src/middleware.ts` — verificar JWT em cookies/localStorage para rotas protegidas, redirect para /login se ausente ou expirado
    - Separar rotas por role: `/resident/*` apenas para moradores, `/concierge/*` apenas para porteiros
    - _Requirements: 1.4, 1.5_

- [x] 13. Frontend: Painel Morador (dashboard, invites, intercom)
  - [x] 13.1 Criar layout e dashboard do morador
    - Criar `apps/frontend/src/app/(resident)/layout.tsx` — layout mobile-first com nav inferior, coluna única em < 768px, espaçamento 16px
    - Criar `apps/frontend/src/app/(resident)/dashboard/page.tsx` — cards de métricas (aprovadas, recusadas, pendentes), tabela paginada de AccessLogs (10/página), empty state quando sem registros
    - Integrar hook useSocket para escutar `access_log_updated` e atualizar em tempo real sem reload
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 13.3, 13.5_

  - [x] 13.2 Criar página de convites do morador
    - Criar `apps/frontend/src/app/(resident)/invites/page.tsx` — formulário de criação (visitor_name + valid_until datetime picker), lista de invites com status/validade/botão copiar link
    - Validação client-side: nome 1-100 chars, data futura (>= 1min)
    - Exibir erros de validação do backend (422)
    - Card de notificação quando `visitor_registered` recebido: nome, foto miniatura, botões "Permitir"/"Recusar"
    - Ações de aprovar/recusar: POST /resident/visit/:id/approve ou /deny, remover card após ação, exibir erro se falhar mantendo card visível
    - _Requirements: 3.1, 3.5, 3.6, 4.5, 5.1, 5.7_

  - [x] 13.3 Criar componente de interfone virtual
    - Criar `apps/frontend/src/app/(resident)/intercom/page.tsx` e `apps/frontend/src/components/intercom/IntercomModal.tsx`
    - Escutar evento `intercom_call` via WebSocket — exibir modal com "Atender"/"Recusar", sinal sonoro (30s timeout)
    - Ao "Atender": solicitar permissões de microfone/câmera, iniciar sessão WebRTC P2P, exibir vídeo remoto + áudio bidirecional
    - Se apenas câmera negada: sessão somente áudio. Se microfone negado: notificação de erro e encerrar
    - Timeout de 10s para estabelecimento WebRTC — se falhar, notificar e encerrar
    - Ao "Recusar" ou timeout 30s: fechar modal, emitir intercom_missed
    - Criar `apps/frontend/src/hooks/useWebRTC.ts` — lógica de sinalização, ICE candidates, media stream
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 14. Frontend: Dashboard Porteiro (grid câmeras, ações rápidas, feed)
  - [x] 14.1 Criar layout do dashboard do porteiro
    - Criar `apps/frontend/src/app/(concierge)/layout.tsx` — layout desktop grid com mínimo 2 colunas, todos painéis visíveis sem sobreposição (1280-1920px), mensagem de resolução mínima se < 1280px
    - Organizar em áreas: grid de câmeras (principal), painel de ações rápidas (lateral), feed de eventos (lateral inferior)
    - _Requirements: 13.4, 13.6_

  - [x] 14.2 Implementar grid de câmeras e player de vídeo
    - Criar `apps/frontend/src/components/camera/CameraGrid.tsx` — grid configurável 1x1, 2x2, 3x3, 4x4, seletor de layout
    - Criar `apps/frontend/src/components/camera/CameraPlayer.tsx` — player HTML5 com WebRTC WHEP (primário) ou fMP4/MSE (fallback), overlay de status ("Offline", "Carregando"), botão retry manual
    - Criar `apps/frontend/src/hooks/useCameraStream.ts` — lógica de conexão WHEP, fallback fMP4, 3 retries a cada 5s
    - Impedir seleção de câmeras além do limite do layout ativo
    - Escutar `camera_offline`/`camera_online` via WebSocket para atualizar overlays
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 14.3 Implementar controles PTZ
    - Criar `apps/frontend/src/components/camera/PtzOverlay.tsx` — botões direcionais + zoom sobrepostos ao player, visíveis apenas se `ptz_supported = true`, área máxima 15% do player
    - Clique em direcional: POST /concierge/cameras/:id/ptz com comando
    - Pressionar e manter zoom: enviar comandos a cada 200ms, cessar ao soltar
    - Criar `apps/frontend/src/hooks/usePtz.ts` — lógica de envio contínuo para zoom
    - Exibir notificação de erro por 5s se comando falhar (502)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 14.4 Implementar painel de ações rápidas
    - Criar `apps/frontend/src/components/concierge/QuickActions.tsx` — botões: "Abrir Portão Principal", "Abrir Porta Bloco", "Liberar Entrada", "Ligar para Morador", "Acionar Alerta de Pânico"
    - "Abrir Portão/Porta": POST /concierge/action com tipo e access_point_id, exibir notificação sucesso (5s) ou erro persistente
    - "Liberar Entrada": seletor de visitantes pending, após seleção executa ação
    - "Ligar para Morador": seletor de moradores, após seleção emite intercom_call
    - "Pânico": confirmação antes de executar, emite panic_alert
    - Escutar `gate_opened` para confirmar abertura
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7, 9.8, 9.9_

  - [x] 14.5 Implementar feed de eventos em tempo real
    - Criar `apps/frontend/src/components/feed/EventFeed.tsx` — painel com máximo 100 entradas, scroll vertical, ícone por tipo de evento, timestamp "DD/MM/AAAA HH:MM:SS"
    - Criar `apps/frontend/src/components/feed/EventCard.tsx` — renderização por tipo com info contextual (nome visitante, nome câmera, access_point)
    - Inserir novos eventos no topo, remover mais antigos ao atingir 100
    - Indicador de status de conexão: "Conectado" (verde), "Reconectando" (amarelo), "Desconectado" (vermelho)
    - Catch-up automático ao reconectar sem duplicar entradas
    - Exibir notificação de visit_approved com opção de abrir portão; visit_denied com nome do visitante recusado
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 5.4, 5.5_

- [x] 15. Frontend: Página Visitante (formulário + captura selfie)
  - [x] 15.1 Implementar página do visitante
    - Criar `apps/frontend/src/app/visitor/[token]/page.tsx` — página pública (sem auth), mobile-first
    - Ao carregar: GET /visitor/invite/:token — se 410 exibir mensagem de expirado, se 409 exibir mensagem de já utilizado, se 200 exibir formulário
    - Formulário: nome completo (3-120 chars), documento (CPF 11 dígitos ou RG 5-14 alfanumérico), captura de selfie
    - Validação client-side em tempo real com mensagens de erro por campo
    - Impedir envio se qualquer campo vazio, formato inválido, ou sem foto
    - Verificar expiração do token periodicamente durante preenchimento — se expirado, bloquear submit e exibir mensagem
    - _Requirements: 4.1, 4.2, 4.9, 4.10, 3.3, 3.4_

  - [x] 15.2 Implementar componente de captura de selfie
    - Criar `apps/frontend/src/components/visitor/SelfieCapture.tsx` — acesso à câmera via `navigator.mediaDevices.getUserMedia`, preview de vídeo, botão de captura, preview da foto tirada
    - Fallback para upload manual da galeria se câmera não suportada ou permissão negada
    - Validar tamanho (max 10MB) e formato (JPEG/PNG/WebP) antes do envio
    - Submeter via multipart form data para POST /visitor/register
    - Exibir loading state durante upload e mensagem de sucesso ao concluir
    - _Requirements: 4.1, 4.3, 4.6, 4.7, 4.8_

- [x] 16. Checkpoint Frontend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Infrastructure: docker-compose + MediaMTX config
  - [x] 17.1 Criar docker-compose para desenvolvimento
    - Criar `infrastructure/docker/docker-compose.yml` com serviços: SQL Server (mcr.microsoft.com/mssql/server:2022-latest), MediaMTX (bluenviern/mediamtx:latest), Backend (build context apps/backend), Frontend (build context apps/frontend)
    - Configurar volumes para persistência do SQL Server
    - Configurar network interna para comunicação entre serviços
    - Expor portas: SQL Server 1433, Backend 3001, Frontend 3000, MediaMTX 8554 (RTSP) + 8889 (WebRTC)
    - _Requirements: 7.4, 7.6_

  - [x] 17.2 Configurar MediaMTX
    - Criar `infrastructure/mediamtx/mediamtx.yml` — config base com paths dinâmicos pattern `cam-*`, sourceOnDemand habilitado, WebRTC WHEP habilitado na porta 8889, fMP4 habilitado como fallback
    - Configurar DTLS-SRTP para streams WebRTC
    - Configurar sourceOnDemandCloseAfter: 30s para liberar recursos quando sem viewers
    - _Requirements: 7.6, 14.3_

  - [x] 17.3 Criar Dockerfiles
    - Criar `infrastructure/docker/Dockerfile.backend` — multi-stage build: deps → build → runtime (node:20-alpine), prisma generate, expor porta 3001
    - Criar `infrastructure/docker/Dockerfile.frontend` — multi-stage build: deps → build → runtime (node:20-alpine), Next.js standalone output, expor porta 3000
    - _Requirements: 14.1_

- [x] 18. Testes: Unit + Property + Integration
  - [x] 18.1 Configurar framework de testes
    - Instalar Vitest + fast-check no backend e frontend
    - Criar `apps/backend/vitest.config.ts` com configuração para NestJS (paths, transforms)
    - Criar `apps/frontend/vitest.config.ts` com configuração para React/Next.js
    - Configurar mínimo 100 iterações por property test com shrinking habilitado
    - Criar helpers de teste: mock de PrismaService, mock de EventsGateway, factory de entidades
    - _Requirements: Todas_

  - [ ]* 18.2 Write unit tests para validações e utilitários
    - Testar validação de CPF (checksum correto/incorreto, formato)
    - Testar validação de IPv4 (formatos válidos/inválidos)
    - Testar validação de portas (boundaries: 0, 1, 65535, 65536)
    - Testar formatação de timestamp para feed ("DD/MM/AAAA HH:MM:SS")
    - Testar lógica de backoff exponencial
    - _Requirements: 4.2, 10.2, 10.4, 11.1, 14.6_

  - [ ]* 18.3 Write property tests para validação de inputs
    - **Property 29: Validação e sanitização de inputs respeita limites do schema**
    - **Property 31: Storage de imagens acessível apenas com token válido**
    - **Validates: Requirements 14.4, 14.6, 12.6**

  - [ ]* 18.4 Write integration tests para fluxos completos
    - Testar fluxo de login → obter dashboard → criar invite → registrar visitante → aprovar
    - Testar fluxo de ação rápida do porteiro → AccessLog criado → evento emitido
    - Testar catch-up de eventos após reconexão WebSocket
    - Testar CRUD de câmeras com validação e unicidade
    - _Requirements: 1.1, 2.1, 3.1, 4.3, 5.2, 9.2, 10.5, 11.1_

- [x] 19. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (31 properties)
- Unit tests validate specific examples and edge cases
- A linguagem de implementação é TypeScript em todo o monorepo (NestJS + Next.js)
- O pacote `@infoseg/shared` garante type-safety entre frontend e backend
- O MediaMTX é tratado como sidecar de infraestrutura, não requer código customizado para streaming

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["3.1", "11.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "11.2"] },
    { "id": 5, "tasks": ["3.4", "11.3", "11.4"] },
    { "id": 6, "tasks": ["3.5", "4.1", "6.1", "12.1", "12.2"] },
    { "id": 7, "tasks": ["4.2", "4.3", "4.4", "4.5"] },
    { "id": 8, "tasks": ["4.6", "5.1", "6.2"] },
    { "id": 9, "tasks": ["5.2", "5.3", "6.3"] },
    { "id": 10, "tasks": ["5.4", "6.4", "7.1"] },
    { "id": 11, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 12, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 13, "tasks": ["8.5", "9.1"] },
    { "id": 14, "tasks": ["9.2", "9.3"] },
    { "id": 15, "tasks": ["13.1", "13.2", "14.1"] },
    { "id": 16, "tasks": ["13.3", "14.2", "14.3"] },
    { "id": 17, "tasks": ["14.4", "14.5", "15.1"] },
    { "id": 18, "tasks": ["15.2"] },
    { "id": 19, "tasks": ["17.1", "17.2", "17.3"] },
    { "id": 20, "tasks": ["18.1"] },
    { "id": 21, "tasks": ["18.2", "18.3", "18.4"] }
  ]
}
```
