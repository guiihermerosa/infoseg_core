Atue como um Engenheiro de Software Sênior e UI/UX Designer. Preciso que você crie a estrutura completa (Front-end e Back-end) para um sistema de Portaria Remota de Condomínios. com o nome de INFOSEG CORE

# 1. VISÃO GERAL E DESIGN
- **Estilo Visual:** Design clean, moderno e minimalista, fortemente inspirado na interface da "Condfy".
- **Paleta de Cores:** Foco em Branco (fundo e base) e tons de Verde (primário, botões de ação, destaques), com cinza claro para bordas e textos secundários.
- **Tipografia:** Sem serifa, legível (ex: Inter ou Roboto).
- **Responsividade:** O painel do morador e o link do visitante devem ser perfeitos para mobile (Mobile First). O dashboard do porteiro deve ser otimizado para telas grandes (Desktop/Monitores).

# 2. STACK TECNOLÓGICA
- **Linguagem Padrão:** TypeScript (tanto no Front quanto no Back).
- **Front-end:** React.js ou Next.js (utilize Tailwind CSS para estilização e componentes Radix/Shadcn UI para o visual clean).
- **Back-end:** Node.js (Express ou NestJS).
- **Banco de Dados:** SQL Server (utilizando um ORM como Prisma ou TypeORM).
- **Tempo Real:** WebSockets (Socket.io) para notificações de entrada, chamadas de interfone e botões de ação.

# 3. ESPECIFICAÇÕES DO FRONT-END (Páginas Principais)

**A. Dashboard dos Moradores (Visualização de Métricas)**
- Gráficos e cards indicando o número de visitas recebidas na semana.
- Tabela/lista com o histórico de acessos ao seu apartamento (quem entrou, data, hora e método de entrada).

**B. Dashboard do Porteiro (Central de Controle)**
- Grid principal para monitoramento de Câmeras (espaço reservado para feeds de vídeo RTSP/WebRTC).
- Painel lateral de "Ações Rápidas" (Botões verdes em destaque: "Abrir Portão Principal", "Abrir Porta Bloco", "Liberar Entrada", "Ligar para Morador", "Acionar Alerta de Pânico").
- Feed de eventos em tempo real (notificações de quem está passando pela catraca/reconhecimento facial).

**C. Painel de Gestão do Morador (Ações do Usuário)**
- Botão para "Gerar Link de Convite" para visitantes (com opção de validade de data/hora).
- Lista de visitantes aguardando liberação (com botões de "Permitir" ou "Recusar").
- Interface de chamada (Interfone Virtual): tela para atender chamadas de áudio/vídeo quando tocarem no apartamento ou chegarem na portaria.

**D. Página do Visitante (Acessada via Link Gerado)**
- Uma landing page mobile-friendly, clean e intuitiva.
- O visitante insere seus dados básicos.
- Deve conter um componente de captura de câmera (usando a API do navegador) para tirar uma selfie.
- Após capturar, a imagem deve ser enviada via API para registro no banco de dados, vinculando a face do visitante ao algoritmo de reconhecimento facial para acesso sem chaves.

# 4. ESPECIFICAÇÕES DO BACK-END E BANCO DE DADOS (SQL SERVER)

**A. Estrutura Básica do Banco de Dados (Entidades sugeridas):**
- `Residents`: id, name, apartment_number, block, phone, email.
- `Visitors`: id, name, document, face_encoding_url (caminho da foto para reconhecimento facial).
- `Visits`: id, resident_id, visitor_id, status (pending, approved, denied), visit_date, invite_link_token.
- `AccessLogs`: id, user_id (morador ou visitante), access_point (portão 1, bloco A), timestamp.

**B. Endpoints da API REST:**
- Auth: Login para porteiros e moradores.
- GET `/resident/dashboard`: Retorna métricas de visitas da semana.
- POST `/resident/invite`: Gera o token único para o link do visitante.
- POST `/visitor/register-face`: Recebe a foto em base64/form-data do link do visitante, salva no storage, vincula ao SQL Server e prepara para o motor de reconhecimento facial.
- POST `/concierge/action`: Recebe comandos do porteiro (ex: abrir portão) e dispara eventos via WebSocket para os hardwares (simulados).

**C. WebSockets (Eventos):**
- `intercom_call`: Disparado quando alguém toca o interfone; notifica o painel do morador.
- `gate_opened`: Atualiza os logs do porteiro em tempo real.

# 5. INSTRUÇÕES DE ENTREGA
1. Comece gerando o esquema do Banco de Dados para SQL Server (modelagem do Prisma ou SQL puro).
2. Forneça o código boilerplate do Back-end focando no fluxo de registro facial do visitante (rotas e controllers).
3. Forneça a estrutura dos componentes do Front-end (React/Tailwind) para o "Dashboard do Porteiro" e a "Página de Captura de Foto do Visitante".
# Adicionar em: 2. STACK TECNOLÓGICA
- **Gateway de Vídeo / Transcodificação:** Utilizar uma abordagem de baixa latência para o ecossistema Web. Sugerir a integração com um servidor de mídia (como MediaMTX, Scrypted ou um microsserviço Node.js com WebRTC/MSE) para converter o fluxo RTSP das câmeras em WebRTC ou fMP4 fragmentado legível pelo navegador.
- **Protocolo de Integração de Câmeras:** Biblioteca ONVIF (ex: node-onvif) no Back-end para descoberta de dispositivos na rede do condomínio, autenticação e controle de movimentação (PTZ).

# Substituir em: 3. ESPECIFICAÇÕES DO FRONT-END -> B. Dashboard do Porteiro
**B. Dashboard do Porteiro (Central de Controle e Vídeo)**
- Grid principal para monitoramento de Câmeras de segurança com suporte a múltiplos canais simultâneos.
- Os players de vídeo devem ser otimizados (componentes HTML5 Video ou Canvas usando WebRTC Whip/Whep ou WebSockets) para garantir latência sub-segundo.
- Sobreposição (Overlay) nos players de vídeo com botões discretos de controle PTZ (Setas para cima, baixo, esquerda, direita e Zoom) que disparam comandos ONVIF via API.
- Painel lateral de "Ações Rápidas" (Botões verdes em destaque: "Abrir Portão Principal", "Abrir Porta Bloco", "Liberar Entrada", "Ligar para Morador", "Acionar Alerta de Pânico").
- Feed de eventos em tempo real (notificações de quem está passando pela catraca/reconhecimento facial).

# Adicionar em: 4. ESPECIFICAÇÕES DO BACK-END E BANCO DE DADOS -> A. Estrutura Básica
- `Cameras`: id, name, ip_address, onvif_port, rtsp_port, username, password, ptz_supported (boolean), location_zone.

# Adicionar em: 4. ESPECIFICAÇÕES DO BACK-END E BANCO DE DADOS -> B. Endpoints da API REST
- GET `/concierge/cameras`: Lista as câmeras cadastradas e seus respectivos status de conexão.
- GET `/concierge/cameras/:id/stream`: Solicita ao gateway de mídia a URL do sinal WebRTC convertido daquela câmera específica.
- POST `/concierge/cameras/:id/ptz`: Recebe comandos de direção (up, down, left, right, zoom) e repassa para a câmera física utilizando o protocolo ONVIF.