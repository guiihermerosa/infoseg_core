# Requirements Document

## Introduction

Este documento descreve os requisitos funcionais e não-funcionais do **Sistema de Portaria Remota de Condomínios**, uma plataforma completa para controle de acesso, monitoramento por câmeras, interfone virtual e gestão de visitantes em condomínios residenciais.

O sistema é composto por quatro grandes interfaces: o **Dashboard do Porteiro** (central de controle e vídeo, desktop), o **Painel do Morador** (gestão de visitas e interfone, mobile-first), a **Página do Visitante** (registro e captura de selfie, mobile-first) e o **Gateway de Mídia** (conversão de fluxo RTSP para WebRTC/fMP4).

A stack tecnológica é TypeScript full-stack: Next.js + Tailwind CSS + Shadcn UI no front-end; NestJS no back-end; SQL Server com Prisma ORM; Socket.io para tempo real; MediaMTX/WebRTC para streaming de câmeras; node-onvif para controle PTZ.

---

## Glossary

- **Sistema**: O sistema de Portaria Remota de Condomínios como um todo.
- **Porteiro**: Usuário com perfil de porteiro/concierge, responsável pela operação da central de controle.
- **Morador**: Usuário residente de uma unidade do condomínio, com acesso ao painel de gestão de visitas.
- **Visitante**: Pessoa externa que solicita acesso ao condomínio por meio de link de convite gerado pelo Morador.
- **Auth_Service**: Módulo responsável por autenticação e autorização de Porteiros e Moradores.
- **Resident_Service**: Módulo de back-end que gerencia dados, métricas e ações do Morador.
- **Concierge_Service**: Módulo de back-end que gerencia ações do Porteiro (portão, câmeras, alertas).
- **Visitor_Service**: Módulo de back-end que gerencia registro, face encoding e visitas de Visitantes.
- **Camera_Service**: Módulo de back-end que gerencia câmeras ONVIF e rota o stream de vídeo.
- **Media_Gateway**: Microsserviço (MediaMTX ou Node.js) responsável por converter fluxo RTSP em WebRTC/fMP4.
- **WebSocket_Server**: Camada Socket.io do back-end que emite eventos em tempo real.
- **Invite_Link**: URL com token único gerado pelo Morador para que um Visitante se registre.
- **Face_Encoding**: Vetor numérico representando o rosto de um Visitante, usado no reconhecimento facial.
- **PTZ**: Pan-Tilt-Zoom — controle direcional e de zoom de câmeras que suportam o protocolo ONVIF.
- **Access_Point**: Ponto físico de controle de acesso (portão principal, porta de bloco, catraca).
- **AccessLog**: Registro imutável de cada evento de acesso ou ação realizada no sistema.
- **JWT**: JSON Web Token utilizado para autenticação stateless entre cliente e servidor.
- **ONVIF**: Protocolo aberto para descoberta e controle de câmeras IP.
- **RTSP**: Real-Time Streaming Protocol — protocolo de stream de vídeo nativo das câmeras IP.
- **Dashboard_Porteiro**: Interface web desktop que exibe o grid de câmeras e os painéis de controle do Porteiro.
- **Painel_Morador**: Interface web mobile-first do Morador para gestão de visitas e interfone.
- **Pagina_Visitante**: Landing page mobile-first acessada pelo Visitante via Invite_Link.
- **Panic_Alert**: Evento de emergência acionado pelo Porteiro que notifica todos os sistemas integrados.

---

## Requirements

---

### Requirement 1: Autenticação e Autorização

**User Story:** Como Porteiro ou Morador, quero fazer login com minhas credenciais, para que eu acesse apenas as funcionalidades autorizadas ao meu perfil.

#### Acceptance Criteria

1. WHEN um usuário submete credenciais válidas (e-mail + senha), THE Auth_Service SHALL retornar um JWT com validade de 8 horas contendo o perfil (`porteiro` ou `morador`) e o identificador do usuário, em no máximo 2 segundos.
2. WHEN um usuário submete credenciais inválidas, THE Auth_Service SHALL retornar o código HTTP 401 com mensagem de erro genérica que não revele qual campo está incorreto e SHALL incrementar o contador de tentativas falhas para o e-mail informado.
3. IF um usuário acumula 5 tentativas de login falhas consecutivas para o mesmo e-mail dentro de um intervalo de 15 minutos, THEN THE Auth_Service SHALL bloquear novas tentativas de login para esse e-mail por 15 minutos e SHALL retornar o código HTTP 429 com mensagem indicando tempo restante de bloqueio.
4. WHEN um JWT expirado ou inválido é recebido em qualquer requisição autenticada, THE Auth_Service SHALL retornar o código HTTP 401 com corpo indicando que o token está expirado ou é inválido.
5. WHEN um Morador autenticado tenta acessar um endpoint restrito a Porteiros, THE Auth_Service SHALL retornar o código HTTP 403.
6. THE Auth_Service SHALL armazenar senhas usando hashing bcrypt com fator de custo mínimo 12.
7. WHEN um usuário solicita recuperação de senha informando um e-mail cadastrado, THE Auth_Service SHALL enviar um link de redefinição por e-mail com token de uso único e validade de 30 minutos.
8. IF um usuário solicita recuperação de senha informando um e-mail não cadastrado, THEN THE Auth_Service SHALL retornar a mesma mensagem de sucesso exibida para e-mails válidos, sem revelar se o e-mail existe no sistema.
9. IF um usuário tenta utilizar um link de redefinição de senha com token expirado ou já utilizado, THEN THE Auth_Service SHALL rejeitar a requisição com código HTTP 400 e mensagem indicando que o link é inválido ou expirado.

---

### Requirement 2: Dashboard de Métricas do Morador

**User Story:** Como Morador, quero visualizar um resumo das visitas que recebi na semana, para que eu acompanhe o histórico de acessos à minha unidade.

#### Acceptance Criteria

1. WHEN um Morador autenticado acessa `GET /resident/dashboard`, THE Resident_Service SHALL retornar o número total de visitas aprovadas, recusadas e pendentes nos últimos 7 dias corridos a partir da data/hora atual, com os registros de AccessLog ordenados do mais recente para o mais antigo, limitados aos últimos 20 registros vinculados à unidade do Morador, contendo nome do visitante, data, hora e método de entrada (portão, catraca ou reconhecimento facial).
2. IF a chamada a `GET /resident/dashboard` falhar por indisponibilidade do serviço ou timeout superior a 5 segundos, THEN THE Painel_Morador SHALL exibir uma mensagem de erro indicando a falha na obtenção dos dados e oferecer um botão para tentar novamente.
3. WHEN o Painel_Morador recebe os dados do Resident_Service com sucesso, THE Painel_Morador SHALL exibir os totais de visitas aprovadas, recusadas e pendentes em cards individuais e os registros de AccessLog em uma tabela paginada com 10 itens por página.
4. IF não existirem visitas ou registros de AccessLog nos últimos 7 dias corridos para a unidade do Morador, THEN THE Painel_Morador SHALL exibir uma mensagem indicando a ausência de registros no período, no lugar dos cards e da tabela.
5. WHILE o Painel_Morador está aberto, WHEN o WebSocket_Server emitir o evento `access_log_updated` para a unidade do Morador, THE Painel_Morador SHALL inserir o novo registro no topo da tabela de AccessLog e atualizar os contadores nos cards de métricas sem recarregar a página, em até 2 segundos após a criação do AccessLog.

---

### Requirement 3: Geração de Link de Convite para Visitante

**User Story:** Como Morador, quero gerar um link de convite com data e hora de validade para meu visitante, para que o visitante possa se registrar e aguardar liberação de forma segura.

#### Acceptance Criteria

1. WHEN um Morador autenticado submete `POST /resident/invite` com `{ visitor_name, valid_until }` onde `visitor_name` possui entre 1 e 100 caracteres e `valid_until` é uma data/hora futura (pelo menos 1 minuto à frente do horário atual do servidor), THE Resident_Service SHALL criar um registro em `Visits` com status `pending` e retornar um Invite_Link contendo um token UUID v4 único.
2. THE Resident_Service SHALL garantir que cada token de Invite_Link seja único — nenhum token duplicado pode existir na tabela `Visits`.
3. IF um Visitante acessa um Invite_Link cujo token está expirado (data/hora atual do servidor é posterior a `valid_until`), THEN THE Visitor_Service SHALL retornar resposta HTTP 410 (Gone) e exibir mensagem informando que o convite expirou.
4. IF um Visitante acessa um Invite_Link cujo status é diferente de `pending`, THEN THE Visitor_Service SHALL retornar resposta HTTP 409 e exibir mensagem informando que o convite já foi utilizado.
5. WHEN um Morador autenticado acessa o Painel_Morador, THE Painel_Morador SHALL exibir a lista de Invite_Links gerados ordenada por data de criação decrescente, contendo status, data de validade e botão para copiar o link.
6. IF o Morador autenticado submete `POST /resident/invite` com `visitor_name` ausente, vazio ou com mais de 100 caracteres, OU `valid_until` ausente ou não representando uma data/hora futura (pelo menos 1 minuto à frente do horário atual do servidor), THEN THE Resident_Service SHALL rejeitar a requisição com HTTP 422 e retornar mensagem de erro indicando quais campos são inválidos.

---

### Requirement 4: Registro de Visitante e Captura de Selfie

**User Story:** Como Visitante, quero preencher meus dados e tirar uma selfie na Pagina_Visitante, para que meu acesso seja registrado e minha identidade possa ser verificada.

#### Acceptance Criteria

1. WHEN um Visitante acessa uma Pagina_Visitante com token válido, THE Pagina_Visitante SHALL exibir um formulário com os campos obrigatórios: nome completo (máximo 120 caracteres), documento (CPF com 11 dígitos ou RG com 5 a 14 caracteres alfanuméricos), e uma área de captura de foto via câmera do dispositivo.
2. IF o Visitante submeter o formulário com qualquer campo obrigatório vazio ou com formato inválido (CPF com dígitos incorretos, nome com menos de 3 caracteres), THEN THE Pagina_Visitante SHALL indicar quais campos estão inválidos e impedir o envio até a correção.
3. WHEN o Visitante submete o formulário com todos os campos válidos e foto capturada, THE Visitor_Service SHALL salvar a imagem no storage e registrar a URL no campo `Visitors.face_encoding_url`.
4. WHEN o Visitor_Service recebe a foto, THE Visitor_Service SHALL atualizar o registro em `Visits` vinculando o `visitor_id` e mantendo o status `pending`.
5. WHEN o Visitor_Service conclui o registro, THE WebSocket_Server SHALL emitir o evento `visitor_registered` ao Morador correspondente contendo nome do visitante e miniatura da foto (máximo 200x200 pixels).
6. IF o navegador do Visitante não suportar acesso à câmera ou a permissão de câmera for negada, THEN THE Pagina_Visitante SHALL exibir uma instrução alternativa para upload manual de foto da galeria.
7. IF a imagem enviada possuir tamanho superior a 10 MB, THEN THE Visitor_Service SHALL rejeitar o envio e retornar uma mensagem de erro indicando que o tamanho máximo permitido é 10 MB.
8. IF o arquivo enviado não estiver nos formatos JPEG, PNG ou WebP, THEN THE Visitor_Service SHALL rejeitar o envio e retornar uma mensagem de erro indicando os formatos aceitos.
9. IF o Visitante submeter o formulário sem foto capturada e sem upload de arquivo, THEN THE Pagina_Visitante SHALL impedir o envio e indicar que a foto é obrigatória.
10. IF o token da Pagina_Visitante expirar durante o preenchimento do formulário, THEN THE Pagina_Visitante SHALL exibir uma mensagem informando que o link expirou e impedir a submissão.

---

### Requirement 5: Aprovação ou Recusa de Visitante pelo Morador

**User Story:** Como Morador, quero aprovar ou recusar um visitante que está aguardando liberação, para que o controle de acesso à minha unidade seja feito por mim.

#### Acceptance Criteria

1. WHEN o Morador recebe o evento `visitor_registered` via WebSocket, THE Painel_Morador SHALL exibir um card de notificação com nome, foto e botões "Permitir" e "Recusar", e SHALL remover o card da lista após o Morador clicar em qualquer um dos botões.
2. WHEN o Morador clica em "Permitir", THE Resident_Service SHALL atualizar `Visits.status` para `approved` e emitir o evento WebSocket `visit_approved` para o Dashboard_Porteiro.
3. WHEN o Morador clica em "Recusar", THE Resident_Service SHALL atualizar `Visits.status` para `denied` e emitir o evento WebSocket `visit_denied` para o Dashboard_Porteiro.
4. WHEN o Dashboard_Porteiro recebe `visit_approved`, THE Dashboard_Porteiro SHALL exibir, em até 3 segundos após a emissão do evento, uma notificação com o nome do visitante aprovado e opção de acionar abertura de portão.
5. WHEN o Dashboard_Porteiro recebe `visit_denied`, THE Dashboard_Porteiro SHALL exibir, em até 3 segundos após a emissão do evento, uma notificação com o nome do visitante recusado.
6. WHEN o Morador clica em "Permitir" ou "Recusar", THE Resident_Service SHALL criar um AccessLog contendo o resultado da decisão (`approved` ou `denied`), o identificador do Morador, o identificador do visitante e a data/hora da decisão.
7. IF o Resident_Service falhar ao atualizar `Visits.status` ou ao emitir o evento WebSocket, THEN THE Painel_Morador SHALL exibir uma mensagem de erro indicando que a decisão não pôde ser processada e SHALL manter o card de notificação visível para nova tentativa.

---

### Requirement 6: Interfone Virtual (Áudio/Vídeo)

**User Story:** Como Morador, quero atender chamadas de áudio e vídeo originadas do interfone do condomínio diretamente no meu painel, para que eu possa me comunicar com visitantes remotamente.

#### Acceptance Criteria

1. WHEN alguém aciona o interfone de um bloco ou portaria, IF o Morador da unidade correspondente estiver conectado ao WebSocket_Server, THEN THE WebSocket_Server SHALL emitir o evento `intercom_call` ao Morador contendo o identificador do Access_Point de origem em no máximo 2 segundos.
2. WHEN alguém aciona o interfone de um bloco ou portaria, IF o Morador da unidade correspondente não estiver conectado ao WebSocket_Server, THEN THE WebSocket_Server SHALL emitir evento `intercom_missed` ao Dashboard_Porteiro em no máximo 2 segundos indicando que o Morador está indisponível.
3. WHEN o Morador recebe o evento `intercom_call`, THE Painel_Morador SHALL exibir modal de chamada com opções "Atender" e "Recusar" e tocar sinal sonoro por até 30 segundos, e SHALL descartar novas chamadas recebidas enquanto o modal estiver ativo.
4. WHEN o Morador clica em "Atender", THE Painel_Morador SHALL iniciar sessão WebRTC ponto-a-ponto entre o painel do Morador e o dispositivo do interfone, e SHALL exibir o stream de vídeo remoto e ativar o áudio bidirecional em no máximo 5 segundos após o clique.
5. WHEN o Morador clica em "Recusar", THE Painel_Morador SHALL fechar o modal de chamada e THE WebSocket_Server SHALL emitir evento `intercom_missed` ao Dashboard_Porteiro para ciência do Porteiro.
6. WHEN o tempo de 30 segundos expira sem resposta do Morador, THE Painel_Morador SHALL fechar o modal de chamada automaticamente e THE WebSocket_Server SHALL emitir evento `intercom_missed` ao Dashboard_Porteiro para ciência do Porteiro.
7. THE Painel_Morador SHALL solicitar permissões de microfone e câmera ao Morador antes de iniciar a sessão WebRTC. IF apenas a permissão de câmera for negada, THEN THE Painel_Morador SHALL iniciar a sessão somente com áudio bidirecional. IF a permissão de microfone for negada, THEN THE Painel_Morador SHALL exibir notificação informando que o interfone não está disponível sem acesso ao microfone e encerrar a chamada.
8. IF a sessão WebRTC não for estabelecida dentro de 10 segundos após o Morador clicar em "Atender", THEN THE Painel_Morador SHALL exibir notificação de falha de conexão, encerrar a tentativa de chamada e THE WebSocket_Server SHALL emitir evento `intercom_missed` ao Dashboard_Porteiro.

---

### Requirement 7: Grid de Monitoramento de Câmeras (Dashboard do Porteiro)

**User Story:** Como Porteiro, quero visualizar múltiplas câmeras simultaneamente no Dashboard_Porteiro, para que eu monitore todas as áreas do condomínio em tempo real.

#### Acceptance Criteria

1. WHEN o Porteiro autenticado acessa o Dashboard_Porteiro, THE Camera_Service SHALL retornar via `GET /concierge/cameras` a lista de câmeras cadastradas com campos: id, nome, localização, status de conexão e flag `ptz_supported`, em no máximo 3 segundos.
2. WHEN o Porteiro seleciona câmeras para exibição, THE Dashboard_Porteiro SHALL renderizar um grid configurável nos layouts 1x1, 2x2, 3x3 ou 4x4 com no máximo 16 câmeras simultâneas.
3. IF o Porteiro tenta selecionar mais câmeras do que o layout ativo comporta, THEN THE Dashboard_Porteiro SHALL impedir a seleção adicional e exibir mensagem indicando o limite máximo de câmeras para o layout atual.
4. WHEN uma câmera está selecionada para exibição, THE Camera_Service SHALL retornar via `GET /concierge/cameras/:id/stream` a URL do stream WebRTC ou fMP4 fornecido pelo Media_Gateway em no máximo 3 segundos.
5. IF o Camera_Service não retornar a URL do stream dentro de 5 segundos ou retornar erro, THEN THE Dashboard_Porteiro SHALL exibir overlay de status indicando falha de carregamento no player correspondente e oferecer opção manual de nova tentativa.
6. THE Dashboard_Porteiro SHALL exibir cada stream de câmera com latência inferior a 2 segundos usando players HTML5 com protocolo WebRTC WHIP/WHEP ou fMP4 fragmentado via Media Source Extensions (MSE).
7. WHEN o Camera_Service não recebe heartbeat de uma câmera por mais de 10 segundos, THE Camera_Service SHALL emitir evento WebSocket `camera_offline` ao Dashboard_Porteiro e THE Dashboard_Porteiro SHALL exibir overlay de status "Offline" no player correspondente.
8. WHEN o Camera_Service recebe heartbeat restabelecido de uma câmera previamente offline, THE Camera_Service SHALL emitir evento WebSocket `camera_online` e THE Dashboard_Porteiro SHALL reconectar o stream automaticamente com até 3 tentativas espaçadas em 5 segundos; IF todas as tentativas falharem, THEN THE Dashboard_Porteiro SHALL manter o overlay "Offline" e exibir opção de reconexão manual.

---

### Requirement 8: Controle PTZ de Câmeras

**User Story:** Como Porteiro, quero controlar o movimento e zoom de câmeras PTZ diretamente no Dashboard_Porteiro, para que eu ajuste o ângulo de visão conforme necessário.

#### Acceptance Criteria

1. WHEN uma câmera com `ptz_supported = true` está sendo exibida, THE Dashboard_Porteiro SHALL sobrepor ao player um overlay com botões de controle PTZ: cima, baixo, esquerda, direita, zoom-in e zoom-out, posicionados de forma a não obstruir mais que 15% da área total do player de vídeo.
2. WHEN o Porteiro pressiona um botão direcional PTZ (up, down, left, right), THE Camera_Service SHALL enviar um comando de movimento discreto (passo único) à câmera via node-onvif através de `POST /concierge/cameras/:id/ptz` com o campo `command` contendo um dos valores: `up`, `down`, `left`, `right`, `zoom_in`, `zoom_out`.
3. WHEN a câmera não suporta PTZ (`ptz_supported = false`), THE Dashboard_Porteiro SHALL ocultar o overlay PTZ para essa câmera.
4. IF o comando PTZ não receber resposta da câmera via ONVIF dentro de 5 segundos, THEN THE Camera_Service SHALL retornar HTTP 502 com mensagem de erro indicando o tipo de falha de comunicação (timeout ou conexão recusada) e THE Dashboard_Porteiro SHALL exibir uma notificação de erro visível por 5 segundos ao Porteiro.
5. WHILE o Porteiro mantém pressionado um botão de zoom (zoom_in ou zoom_out), THE Dashboard_Porteiro SHALL enviar comandos de zoom contínuos à câmera a cada 200ms e SHALL cessar o envio quando o botão for liberado.
6. IF um segundo Porteiro enviar um comando PTZ para a mesma câmera que já está recebendo comandos de outro Porteiro, THEN THE Camera_Service SHALL processar o comando mais recente e descartar o anterior.

---

### Requirement 9: Ações Rápidas do Porteiro

**User Story:** Como Porteiro, quero executar ações de controle de acesso com um clique no painel lateral do Dashboard_Porteiro, para que eu responda rapidamente a situações de entrada e emergência.

#### Acceptance Criteria

1. THE Dashboard_Porteiro SHALL exibir um painel lateral com os seguintes botões de ação rápida: "Abrir Portão Principal", "Abrir Porta Bloco", "Liberar Entrada", "Ligar para Morador" e "Acionar Alerta de Pânico".
2. WHEN o Porteiro clica em "Abrir Portão Principal" ou "Abrir Porta Bloco", THE Concierge_Service SHALL receber `POST /concierge/action` com o tipo de ação e o identificador do Access_Point, enviar o comando ao controlador físico e retornar confirmação HTTP 200 em no máximo 3 segundos após o clique.
3. WHEN o Concierge_Service processa uma ação de abertura com sucesso, THE WebSocket_Server SHALL emitir o evento `gate_opened` com timestamp e identificador do Access_Point para todos os clientes do Dashboard_Porteiro conectados.
4. WHEN o Porteiro clica em "Acionar Alerta de Pânico", THE Concierge_Service SHALL emitir o evento WebSocket `panic_alert` para todos os clientes conectados e registrar um AccessLog com tipo `panic`.
5. THE Concierge_Service SHALL criar um AccessLog para cada ação executada pelo Porteiro contendo: tipo de ação, identificador do Porteiro, Access_Point e timestamp.
6. IF o comando de abertura falhar na comunicação com o controlador físico ou o tempo de resposta exceder 3 segundos, THEN THE Concierge_Service SHALL retornar HTTP 503 e THE Dashboard_Porteiro SHALL exibir uma notificação de falha indicando qual Access_Point não respondeu, mantendo a notificação visível até o Porteiro descartá-la manualmente, sem encerrar a sessão.
7. WHEN o Porteiro clica em "Liberar Entrada", THE Dashboard_Porteiro SHALL exibir um seletor com a lista de visitantes com status `pending` e, após o Porteiro selecionar um visitante, THE Concierge_Service SHALL atualizar o status da visita para `approved`, registrar um AccessLog com tipo `entry_release` e emitir o evento WebSocket `gate_opened` com o Access_Point correspondente.
8. WHEN o Porteiro clica em "Ligar para Morador", THE Dashboard_Porteiro SHALL exibir um seletor com a lista de moradores do condomínio e, após o Porteiro selecionar um morador, THE WebSocket_Server SHALL emitir o evento `intercom_call` para o cliente do morador selecionado, iniciando a chamada de interfone virtual.
9. WHEN o Dashboard_Porteiro recebe confirmação de sucesso (HTTP 200) de qualquer ação rápida, THE Dashboard_Porteiro SHALL exibir uma notificação visual de sucesso indicando a ação executada e o Access_Point afetado, permanecendo visível por 5 segundos.

---

### Requirement 10: Feed de Eventos em Tempo Real (Dashboard do Porteiro)

**User Story:** Como Porteiro, quero ver um feed contínuo de eventos de acesso e notificações no Dashboard_Porteiro, para que eu esteja sempre informado sobre o que ocorre no condomínio.

#### Acceptance Criteria

1. WHILE o Dashboard_Porteiro está aberto e o Porteiro está autenticado, THE WebSocket_Server SHALL manter uma conexão ativa com o cliente e retransmitir os eventos: `visitor_registered`, `visit_approved`, `visit_denied`, `gate_opened`, `camera_offline`, `camera_online` e `panic_alert`.
2. WHEN qualquer evento do feed é recebido, THE Dashboard_Porteiro SHALL inserir uma entrada no topo do painel de feed com: ícone correspondente ao tipo de evento, descrição textual, timestamp no formato "DD/MM/AAAA HH:MM:SS", e informação contextual conforme o tipo — nome do visitante para eventos `visitor_registered`, `visit_approved` e `visit_denied`; nome da câmera para eventos `camera_offline` e `camera_online`; identificação do ponto de acesso para `gate_opened`.
3. THE Dashboard_Porteiro SHALL manter no máximo 100 entradas visíveis no feed, removendo as mais antigas quando o limite for atingido.
4. WHEN a conexão WebSocket é interrompida, THE Dashboard_Porteiro SHALL tentar reconectar automaticamente com backoff exponencial iniciando em 1 segundo e dobrando a cada tentativa até o máximo de 30 segundos entre tentativas, e SHALL exibir um indicador de status de conexão com três estados distintos: "Conectado", "Reconectando" e "Desconectado".
5. WHEN a conexão WebSocket é restabelecida após uma interrupção, THE Dashboard_Porteiro SHALL solicitar ao servidor os eventos ocorridos durante o período de desconexão (limitados aos últimos 100 eventos) e inseri-los no feed em ordem cronológica, sem duplicar entradas já exibidas.

---

### Requirement 11: Cadastro e Gerenciamento de Câmeras

**User Story:** Como administrador do sistema, quero cadastrar e gerenciar câmeras IP no sistema, para que o Porteiro possa monitorar e controlar os dispositivos do condomínio.

#### Acceptance Criteria

1. THE Camera_Service SHALL expor endpoints CRUD para a entidade `Cameras` com campos obrigatórios: `name` (máximo 100 caracteres), `ip_address` (formato IPv4 válido), `onvif_port` (inteiro entre 1 e 65535), `rtsp_port` (inteiro entre 1 e 65535), `username` (máximo 50 caracteres), `password` (máximo 128 caracteres), `ptz_supported` (booleano) e `location_zone` (máximo 100 caracteres).
2. WHEN uma câmera é cadastrada ou atualizada, THE Camera_Service SHALL tentar uma conexão de teste via node-onvif com timeout de 5 segundos e retornar no response o campo `connection_status` com valor `online` ou `offline`.
3. IF uma requisição de criação ou atualização de câmera contiver campos obrigatórios ausentes, formato de IP inválido ou portas fora do intervalo permitido, THEN THE Camera_Service SHALL rejeitar a requisição com uma mensagem de erro indicando o campo e a regra de validação violada.
4. THE Camera_Service SHALL armazenar as credenciais de câmeras (`username`, `password`) de forma criptografada no banco de dados, nunca expondo-as em responses da API.
5. WHEN `GET /concierge/cameras` é chamado, THE Camera_Service SHALL retornar a lista de câmeras sem os campos de credenciais (`username`, `password`), limitada a no máximo 100 registros por página.
6. IF uma requisição de criação de câmera informar um `ip_address` e `onvif_port` já cadastrados para outra câmera, THEN THE Camera_Service SHALL rejeitar a requisição com uma mensagem de erro indicando duplicidade de endereço.

---

### Requirement 12: Persistência e Esquema de Banco de Dados

**User Story:** Como desenvolvedor, quero um esquema de banco de dados bem definido no SQL Server via Prisma, para que todos os dados do sistema sejam armazenados com integridade referencial.

#### Acceptance Criteria

1. THE Sistema SHALL persistir todas as entidades no SQL Server usando Prisma ORM com as seguintes tabelas: `Residents` (id, name, apartment_number, block, phone, email), `Visitors` (id, name, document, face_encoding_url), `Visits` (id, resident_id, visitor_id, status, visit_date, invite_link_token), `AccessLogs` (id, user_id, user_type, access_point, timestamp), `Cameras` (id, name, ip_address, onvif_port, rtsp_port, username, password, ptz_supported, location_zone) e `Concierges` (id, name, email, phone).
2. THE Sistema SHALL garantir que `Visits.resident_id` tenha chave estrangeira referenciando `Residents.id` e que `Visits.visitor_id` tenha chave estrangeira referenciando `Visitors.id`.
3. THE Sistema SHALL garantir que `AccessLogs` contenha uma coluna discriminadora `user_type` (com valores restritos a "resident", "visitor" ou "concierge") que identifica a tabela de origem de `user_id`, e SHALL aplicar restrição CHECK para que `user_type` aceite apenas esses três valores.
4. THE Sistema SHALL definir índices em `Visits.invite_link_token` (unique), `Visits.resident_id`, `AccessLogs.timestamp` e `Cameras.ip_address` para otimização de consultas.
5. WHEN uma migração Prisma é executada, THE Sistema SHALL aplicar as alterações de esquema preservando todos os registros existentes nas tabelas afetadas, sem remoção ou corrupção de linhas previamente inseridas.
6. THE Sistema SHALL definir os campos de texto com limites máximos: `name` até 150 caracteres, `email` até 255 caracteres, `phone` até 20 caracteres, `document` até 30 caracteres, `invite_link_token` até 255 caracteres, `ip_address` até 45 caracteres e `access_point` até 100 caracteres.
7. THE Sistema SHALL definir a coluna `Visits.status` com restrição CHECK permitindo apenas os valores "pending", "approved" ou "denied".

---

### Requirement 13: Design e Responsividade da Interface

**User Story:** Como usuário do sistema, quero uma interface visual limpa, moderna e responsiva, para que eu tenha uma experiência intuitiva independentemente do dispositivo.

#### Acceptance Criteria

1. THE Sistema SHALL implementar a interface usando Next.js, Tailwind CSS e componentes Shadcn UI (baseados em Radix UI) com paleta de cores: branco (#FFFFFF) para fundo, verde primário (#16A34A ou equivalente) para botões de ação e destaques, e cinza claro (#E5E7EB) para bordas e textos secundários.
2. THE Sistema SHALL utilizar tipografia Inter ou Roboto (sans-serif) com tamanho mínimo de corpo de 14px em desktop e 16px em mobile em todas as interfaces.
3. THE Painel_Morador e THE Pagina_Visitante SHALL ser desenvolvidos com abordagem Mobile First, suportando viewports de 375px a 1440px de largura, com todos os elementos interativos apresentando área de toque mínima de 44x44 pixels e todo o conteúdo visível sem necessidade de rolagem horizontal.
4. THE Dashboard_Porteiro SHALL apresentar todos os painéis (grid de câmeras, ações rápidas e feed de eventos) simultaneamente visíveis sem sobreposição em viewports de 1280px a 1920px de largura, com layout em grid de no mínimo duas colunas.
5. WHEN a tela do Painel_Morador é acessada em viewport menor que 768px, THE Painel_Morador SHALL reorganizar os componentes em layout de coluna única sem sobreposição de elementos e com espaçamento vertical mínimo de 16px entre componentes.
6. IF o Dashboard_Porteiro for acessado em viewport menor que 1280px, THEN THE Dashboard_Porteiro SHALL exibir uma mensagem indicando que a resolução mínima recomendada é 1280x720 pixels, mantendo o conteúdo acessível em layout de coluna única com rolagem vertical.

---

### Requirement 14: Segurança e Privacidade de Dados

**User Story:** Como administrador do sistema, quero que dados sensíveis sejam protegidos e transmitidos de forma segura, para que a privacidade dos moradores e visitantes seja garantida.

#### Acceptance Criteria

1. THE Sistema SHALL transmitir todas as comunicações entre cliente e servidor via HTTPS (TLS 1.2 ou superior).
2. IF a negociação TLS falhar entre cliente e servidor, THEN THE Sistema SHALL recusar a conexão e não transmitir dados em texto plano.
3. THE Sistema SHALL transmitir todos os streams de vídeo WebRTC com DTLS-SRTP habilitado.
4. WHEN imagens de Face_Encoding são armazenadas, THE Visitor_Service SHALL salvar apenas a URL do arquivo no banco de dados, mantendo o arquivo binário em storage isolado acessível exclusivamente mediante token de autenticação válido emitido pelo Auth_Service.
5. THE Auth_Service SHALL implementar rate limiting de no máximo 10 tentativas de login por IP em janela de 15 minutos, retornando HTTP 429 ao exceder o limite e restabelecendo a contagem a zero após o término da janela de 15 minutos.
6. THE Sistema SHALL validar e sanitizar todos os inputs de formulários no back-end, rejeitando requisições com campos que excedam os tamanhos máximos definidos no schema Prisma e retornando HTTP 400 com mensagem indicando o campo inválido e o limite excedido.
7. THE Sistema SHALL armazenar campos de dados pessoais sensíveis (phone, email, document e face_encoding_url) cifrados em repouso no banco de dados, impedindo leitura direta por acesso ao storage físico.
