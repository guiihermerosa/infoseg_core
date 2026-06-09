export declare const FIELD_LIMITS: {
    readonly NAME_MAX: 150;
    readonly VISITOR_NAME_MAX: 120;
    readonly EMAIL_MAX: 255;
    readonly PHONE_MAX: 20;
    readonly DOCUMENT_MAX: 30;
    readonly INVITE_LINK_TOKEN_MAX: 255;
    readonly IP_ADDRESS_MAX: 45;
    readonly ACCESS_POINT_MAX: 100;
    readonly CAMERA_NAME_MAX: 100;
    readonly CAMERA_USERNAME_MAX: 50;
    readonly CAMERA_PASSWORD_MAX: 128;
    readonly LOCATION_ZONE_MAX: 100;
    readonly INVITE_VISITOR_NAME_MIN: 1;
    readonly INVITE_VISITOR_NAME_MAX: 100;
    readonly VISITOR_NAME_MIN: 3;
    readonly CPF_LENGTH: 11;
    readonly RG_MIN_LENGTH: 5;
    readonly RG_MAX_LENGTH: 14;
    readonly IMAGE_MAX_SIZE_BYTES: number;
    readonly PORT_MIN: 1;
    readonly PORT_MAX: 65535;
    readonly FEED_MAX_ENTRIES: 100;
    readonly ACCESS_LOG_PAGE_SIZE: 10;
    readonly ACCESS_LOG_LIMIT: 20;
    readonly CAMERAS_PAGE_SIZE: 100;
};
export declare const RATE_LIMIT: {
    /** Número máximo de tentativas de login por email */
    readonly MAX_ATTEMPTS: 5;
    /** Janela de tempo para contagem de tentativas (em minutos) */
    readonly WINDOW_MINUTES: 15;
    /** Tempo de bloqueio após exceder tentativas (em minutos) */
    readonly BLOCK_DURATION_MINUTES: 15;
    /** Número máximo de tentativas de login por IP */
    readonly MAX_ATTEMPTS_PER_IP: 10;
};
export declare const JWT: {
    /** Tempo de expiração do token JWT */
    readonly EXPIRES_IN: "8h";
    /** Tempo de expiração em segundos (para cálculos) */
    readonly EXPIRES_IN_SECONDS: number;
};
export declare const TIMEOUTS: {
    /** Timeout para conexão ONVIF com câmera (ms) */
    readonly ONVIF_CONNECTION_MS: 5000;
    /** Timeout para comando PTZ (ms) */
    readonly PTZ_COMMAND_MS: 5000;
    /** Timeout para resposta do controlador físico (ms) */
    readonly ACCESS_POINT_MS: 3000;
    /** Timeout da API de dashboard (ms) */
    readonly DASHBOARD_API_MS: 5000;
    /** Intervalo de heartbeat de câmera (ms) */
    readonly CAMERA_HEARTBEAT_INTERVAL_MS: 10000;
    /** Timeout para estabelecimento WebRTC (ms) */
    readonly WEBRTC_ESTABLISHMENT_MS: 10000;
    /** Tempo de toque do interfone antes de timeout (ms) */
    readonly INTERCOM_RING_MS: 30000;
    /** Intervalo de envio contínuo de comandos de zoom (ms) */
    readonly PTZ_ZOOM_CONTINUOUS_INTERVAL_MS: 200;
    /** Duração de movimento discreto PTZ (ms) */
    readonly PTZ_DISCRETE_MOVE_MS: 300;
    /** Intervalo entre tentativas de reconexão de câmera (ms) */
    readonly CAMERA_RECONNECT_INTERVAL_MS: 5000;
    /** Número máximo de tentativas de reconexão de câmera */
    readonly CAMERA_RECONNECT_MAX_RETRIES: 3;
    /** Token de recuperação de senha — validade (minutos) */
    readonly PASSWORD_RESET_TOKEN_MINUTES: 30;
};
export declare const VALIDATION_REGEX: {
    /** Formato IPv4: 0-255.0-255.0-255.0-255 */
    readonly IPV4: RegExp;
    /** CPF: exatamente 11 dígitos numéricos */
    readonly CPF: RegExp;
    /** UUID v4 */
    readonly UUID_V4: RegExp;
    /** RG: 5 a 14 caracteres alfanuméricos */
    readonly RG: RegExp;
    /** Email básico */
    readonly EMAIL: RegExp;
};
export declare const ACCEPTED_IMAGE_MIMETYPES: readonly ["image/jpeg", "image/png", "image/webp"];
export type AcceptedImageMimetype = (typeof ACCEPTED_IMAGE_MIMETYPES)[number];
/** Máximo de tentativas de login por email */
export declare const RATE_LIMIT_MAX_ATTEMPTS = 5;
/** Máximo de tentativas de login por IP */
export declare const RATE_LIMIT_IP_MAX = 10;
/** Janela de rate limiting em minutos */
export declare const RATE_LIMIT_WINDOW_MINUTES = 15;
/** Tempo de expiração do token JWT */
export declare const JWT_EXPIRATION = "8h";
/** Tamanho máximo de imagem em bytes (10MB) */
export declare const MAX_IMAGE_SIZE_BYTES: number;
/** Tipos MIME de imagem aceitos */
export declare const ALLOWED_IMAGE_MIMETYPES: readonly ["image/jpeg", "image/png", "image/webp"];
/** Comprimento máximo do nome do visitante */
export declare const VISITOR_NAME_MAX_LENGTH = 120;
/** Comprimento mínimo do nome do visitante */
export declare const VISITOR_NAME_MIN_LENGTH = 3;
/** Comprimento máximo do nome no convite */
export declare const INVITE_NAME_MAX_LENGTH = 100;
/** Timeout de conexão ONVIF (ms) */
export declare const ONVIF_TIMEOUT_MS = 5000;
/** Duração de passo PTZ discreto (ms) */
export declare const PTZ_STEP_DURATION_MS = 300;
/** Intervalo de envio contínuo de zoom PTZ (ms) */
export declare const PTZ_ZOOM_INTERVAL_MS = 200;
/** Intervalo de heartbeat de câmera (ms) */
export declare const CAMERA_HEARTBEAT_INTERVAL_MS = 10000;
/** Timeout do interfone (ms) */
export declare const INTERCOM_TIMEOUT_MS = 30000;
/** Timeout para conexão WebRTC (ms) */
export declare const WEBRTC_CONNECT_TIMEOUT_MS = 10000;
/** Máximo de eventos no buffer do WebSocket */
export declare const WEBSOCKET_MAX_EVENTS_BUFFER = 100;
/** Limite de registros no dashboard do morador */
export declare const DASHBOARD_LOG_LIMIT = 20;
/** Intervalo de dias do dashboard */
export declare const DASHBOARD_DAYS_RANGE = 7;
/** Tamanho de página das tabelas */
export declare const TABLE_PAGE_SIZE = 10;
/** Máximo de câmeras no grid */
export declare const CAMERA_MAX_GRID = 16;
/** Regex para IPv4 válido */
export declare const IPv4_REGEX: RegExp;
/** Regex para UUID v4 */
export declare const UUID_V4_REGEX: RegExp;
/** Regex para CPF (11 dígitos) */
export declare const CPF_REGEX: RegExp;
//# sourceMappingURL=index.d.ts.map