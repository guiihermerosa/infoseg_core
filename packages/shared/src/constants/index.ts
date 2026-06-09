// ─── Limites de campos ────────────────────────────────────────────────────────

export const FIELD_LIMITS = {
  NAME_MAX: 150,
  VISITOR_NAME_MAX: 120,
  EMAIL_MAX: 255,
  PHONE_MAX: 20,
  DOCUMENT_MAX: 30,
  INVITE_LINK_TOKEN_MAX: 255,
  IP_ADDRESS_MAX: 45,
  ACCESS_POINT_MAX: 100,
  CAMERA_NAME_MAX: 100,
  CAMERA_USERNAME_MAX: 50,
  CAMERA_PASSWORD_MAX: 128,
  LOCATION_ZONE_MAX: 100,
  INVITE_VISITOR_NAME_MIN: 1,
  INVITE_VISITOR_NAME_MAX: 100,
  VISITOR_NAME_MIN: 3,
  CPF_LENGTH: 11,
  RG_MIN_LENGTH: 5,
  RG_MAX_LENGTH: 14,
  IMAGE_MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  PORT_MIN: 1,
  PORT_MAX: 65535,
  FEED_MAX_ENTRIES: 100,
  ACCESS_LOG_PAGE_SIZE: 10,
  ACCESS_LOG_LIMIT: 20,
  CAMERAS_PAGE_SIZE: 100,
} as const;

// ─── Timeouts e Rate Limiting ────────────────────────────────────────────────

export const RATE_LIMIT = {
  /** Número máximo de tentativas de login por email */
  MAX_ATTEMPTS: 5,
  /** Janela de tempo para contagem de tentativas (em minutos) */
  WINDOW_MINUTES: 15,
  /** Tempo de bloqueio após exceder tentativas (em minutos) */
  BLOCK_DURATION_MINUTES: 15,
  /** Número máximo de tentativas de login por IP */
  MAX_ATTEMPTS_PER_IP: 10,
} as const;

export const JWT = {
  /** Tempo de expiração do token JWT */
  EXPIRES_IN: '8h',
  /** Tempo de expiração em segundos (para cálculos) */
  EXPIRES_IN_SECONDS: 8 * 60 * 60, // 28800s
} as const;

export const TIMEOUTS = {
  /** Timeout para conexão ONVIF com câmera (ms) */
  ONVIF_CONNECTION_MS: 5000,
  /** Timeout para comando PTZ (ms) */
  PTZ_COMMAND_MS: 5000,
  /** Timeout para resposta do controlador físico (ms) */
  ACCESS_POINT_MS: 3000,
  /** Timeout da API de dashboard (ms) */
  DASHBOARD_API_MS: 5000,
  /** Intervalo de heartbeat de câmera (ms) */
  CAMERA_HEARTBEAT_INTERVAL_MS: 10000,
  /** Timeout para estabelecimento WebRTC (ms) */
  WEBRTC_ESTABLISHMENT_MS: 10000,
  /** Tempo de toque do interfone antes de timeout (ms) */
  INTERCOM_RING_MS: 30000,
  /** Intervalo de envio contínuo de comandos de zoom (ms) */
  PTZ_ZOOM_CONTINUOUS_INTERVAL_MS: 200,
  /** Duração de movimento discreto PTZ (ms) */
  PTZ_DISCRETE_MOVE_MS: 300,
  /** Intervalo entre tentativas de reconexão de câmera (ms) */
  CAMERA_RECONNECT_INTERVAL_MS: 5000,
  /** Número máximo de tentativas de reconexão de câmera */
  CAMERA_RECONNECT_MAX_RETRIES: 3,
  /** Token de recuperação de senha — validade (minutos) */
  PASSWORD_RESET_TOKEN_MINUTES: 30,
} as const;

// ─── Regex de validação ──────────────────────────────────────────────────────

export const VALIDATION_REGEX = {
  /** Formato IPv4: 0-255.0-255.0-255.0-255 */
  IPV4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  /** CPF: exatamente 11 dígitos numéricos */
  CPF: /^\d{11}$/,
  /** UUID v4 */
  UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  /** RG: 5 a 14 caracteres alfanuméricos */
  RG: /^[a-zA-Z0-9]{5,14}$/,
  /** Email básico */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ─── Formatos de imagem aceitos ──────────────────────────────────────────────

export const ACCEPTED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AcceptedImageMimetype = (typeof ACCEPTED_IMAGE_MIMETYPES)[number];

// ─── Constantes com nomes planos (aliases para acesso direto) ────────────────

/** Máximo de tentativas de login por email */
export const RATE_LIMIT_MAX_ATTEMPTS = 5;

/** Máximo de tentativas de login por IP */
export const RATE_LIMIT_IP_MAX = 10;

/** Janela de rate limiting em minutos */
export const RATE_LIMIT_WINDOW_MINUTES = 15;

/** Tempo de expiração do token JWT */
export const JWT_EXPIRATION = '8h';

/** Tamanho máximo de imagem em bytes (10MB) */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Tipos MIME de imagem aceitos */
export const ALLOWED_IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Comprimento máximo do nome do visitante */
export const VISITOR_NAME_MAX_LENGTH = 120;

/** Comprimento mínimo do nome do visitante */
export const VISITOR_NAME_MIN_LENGTH = 3;

/** Comprimento máximo do nome no convite */
export const INVITE_NAME_MAX_LENGTH = 100;

/** Timeout de conexão ONVIF (ms) */
export const ONVIF_TIMEOUT_MS = 5000;

/** Duração de passo PTZ discreto (ms) */
export const PTZ_STEP_DURATION_MS = 300;

/** Intervalo de envio contínuo de zoom PTZ (ms) */
export const PTZ_ZOOM_INTERVAL_MS = 200;

/** Intervalo de heartbeat de câmera (ms) */
export const CAMERA_HEARTBEAT_INTERVAL_MS = 10000;

/** Timeout do interfone (ms) */
export const INTERCOM_TIMEOUT_MS = 30000;

/** Timeout para conexão WebRTC (ms) */
export const WEBRTC_CONNECT_TIMEOUT_MS = 10000;

/** Máximo de eventos no buffer do WebSocket */
export const WEBSOCKET_MAX_EVENTS_BUFFER = 100;

/** Limite de registros no dashboard do morador */
export const DASHBOARD_LOG_LIMIT = 20;

/** Intervalo de dias do dashboard */
export const DASHBOARD_DAYS_RANGE = 7;

/** Tamanho de página das tabelas */
export const TABLE_PAGE_SIZE = 10;

/** Máximo de câmeras no grid */
export const CAMERA_MAX_GRID = 16;

/** Regex para IPv4 válido */
export const IPv4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

/** Regex para UUID v4 */
export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Regex para CPF (11 dígitos) */
export const CPF_REGEX = /^\d{11}$/;
