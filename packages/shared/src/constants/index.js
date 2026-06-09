"use strict";
// ─── Limites de campos ────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPF_REGEX = exports.UUID_V4_REGEX = exports.IPv4_REGEX = exports.CAMERA_MAX_GRID = exports.TABLE_PAGE_SIZE = exports.DASHBOARD_DAYS_RANGE = exports.DASHBOARD_LOG_LIMIT = exports.WEBSOCKET_MAX_EVENTS_BUFFER = exports.WEBRTC_CONNECT_TIMEOUT_MS = exports.INTERCOM_TIMEOUT_MS = exports.CAMERA_HEARTBEAT_INTERVAL_MS = exports.PTZ_ZOOM_INTERVAL_MS = exports.PTZ_STEP_DURATION_MS = exports.ONVIF_TIMEOUT_MS = exports.INVITE_NAME_MAX_LENGTH = exports.VISITOR_NAME_MIN_LENGTH = exports.VISITOR_NAME_MAX_LENGTH = exports.ALLOWED_IMAGE_MIMETYPES = exports.MAX_IMAGE_SIZE_BYTES = exports.JWT_EXPIRATION = exports.RATE_LIMIT_WINDOW_MINUTES = exports.RATE_LIMIT_IP_MAX = exports.RATE_LIMIT_MAX_ATTEMPTS = exports.ACCEPTED_IMAGE_MIMETYPES = exports.VALIDATION_REGEX = exports.TIMEOUTS = exports.JWT = exports.RATE_LIMIT = exports.FIELD_LIMITS = void 0;
exports.FIELD_LIMITS = {
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
};
// ─── Timeouts e Rate Limiting ────────────────────────────────────────────────
exports.RATE_LIMIT = {
    /** Número máximo de tentativas de login por email */
    MAX_ATTEMPTS: 5,
    /** Janela de tempo para contagem de tentativas (em minutos) */
    WINDOW_MINUTES: 15,
    /** Tempo de bloqueio após exceder tentativas (em minutos) */
    BLOCK_DURATION_MINUTES: 15,
    /** Número máximo de tentativas de login por IP */
    MAX_ATTEMPTS_PER_IP: 10,
};
exports.JWT = {
    /** Tempo de expiração do token JWT */
    EXPIRES_IN: '8h',
    /** Tempo de expiração em segundos (para cálculos) */
    EXPIRES_IN_SECONDS: 8 * 60 * 60, // 28800s
};
exports.TIMEOUTS = {
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
};
// ─── Regex de validação ──────────────────────────────────────────────────────
exports.VALIDATION_REGEX = {
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
};
// ─── Formatos de imagem aceitos ──────────────────────────────────────────────
exports.ACCEPTED_IMAGE_MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
];
// ─── Constantes com nomes planos (aliases para acesso direto) ────────────────
/** Máximo de tentativas de login por email */
exports.RATE_LIMIT_MAX_ATTEMPTS = 5;
/** Máximo de tentativas de login por IP */
exports.RATE_LIMIT_IP_MAX = 10;
/** Janela de rate limiting em minutos */
exports.RATE_LIMIT_WINDOW_MINUTES = 15;
/** Tempo de expiração do token JWT */
exports.JWT_EXPIRATION = '8h';
/** Tamanho máximo de imagem em bytes (10MB) */
exports.MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
/** Tipos MIME de imagem aceitos */
exports.ALLOWED_IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** Comprimento máximo do nome do visitante */
exports.VISITOR_NAME_MAX_LENGTH = 120;
/** Comprimento mínimo do nome do visitante */
exports.VISITOR_NAME_MIN_LENGTH = 3;
/** Comprimento máximo do nome no convite */
exports.INVITE_NAME_MAX_LENGTH = 100;
/** Timeout de conexão ONVIF (ms) */
exports.ONVIF_TIMEOUT_MS = 5000;
/** Duração de passo PTZ discreto (ms) */
exports.PTZ_STEP_DURATION_MS = 300;
/** Intervalo de envio contínuo de zoom PTZ (ms) */
exports.PTZ_ZOOM_INTERVAL_MS = 200;
/** Intervalo de heartbeat de câmera (ms) */
exports.CAMERA_HEARTBEAT_INTERVAL_MS = 10000;
/** Timeout do interfone (ms) */
exports.INTERCOM_TIMEOUT_MS = 30000;
/** Timeout para conexão WebRTC (ms) */
exports.WEBRTC_CONNECT_TIMEOUT_MS = 10000;
/** Máximo de eventos no buffer do WebSocket */
exports.WEBSOCKET_MAX_EVENTS_BUFFER = 100;
/** Limite de registros no dashboard do morador */
exports.DASHBOARD_LOG_LIMIT = 20;
/** Intervalo de dias do dashboard */
exports.DASHBOARD_DAYS_RANGE = 7;
/** Tamanho de página das tabelas */
exports.TABLE_PAGE_SIZE = 10;
/** Máximo de câmeras no grid */
exports.CAMERA_MAX_GRID = 16;
/** Regex para IPv4 válido */
exports.IPv4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
/** Regex para UUID v4 */
exports.UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Regex para CPF (11 dígitos) */
exports.CPF_REGEX = /^\d{11}$/;
//# sourceMappingURL=index.js.map