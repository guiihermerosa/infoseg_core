/**
 * WebSocket Events — Tipagem e constantes para comunicação em tempo real
 * @module @infoseg/shared/events
 */

// ---------------------------------------------------------------------------
// Constantes de nomes de eventos
// ---------------------------------------------------------------------------

export const WS_EVENTS = {
  VISITOR_REGISTERED: 'visitor_registered',
  VISIT_APPROVED: 'visit_approved',
  VISIT_DENIED: 'visit_denied',
  GATE_OPENED: 'gate_opened',
  CAMERA_OFFLINE: 'camera_offline',
  CAMERA_ONLINE: 'camera_online',
  PANIC_ALERT: 'panic_alert',
  INTERCOM_CALL: 'intercom_call',
  INTERCOM_MISSED: 'intercom_missed',
  ACCESS_LOG_UPDATED: 'access_log_updated',
  SYNC_EVENTS: 'sync_events',
  SYNC_EVENTS_RESPONSE: 'sync_events_response',
} as const;

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

// ---------------------------------------------------------------------------
// Rooms — helpers para nomes de salas Socket.io
// ---------------------------------------------------------------------------

export const WS_ROOMS = {
  resident: (id: string) => `resident:${id}`,
  concierge: 'concierge:all',
} as const;

/**
 * @deprecated Use WS_ROOMS.resident(id) instead
 */
export const ROOM_RESIDENT = (id: string): string => `resident:${id}`;

/**
 * @deprecated Use WS_ROOMS.concierge instead
 */
export const ROOM_CONCIERGE = 'concierge:all';

// ---------------------------------------------------------------------------
// Interface base de eventos
// ---------------------------------------------------------------------------

export interface BaseEvent {
  event_id: string;
  timestamp: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Interfaces de payload por evento
// ---------------------------------------------------------------------------

/** Emitido para `resident:{id}` quando um visitante conclui o registro */
export interface VisitorRegisteredEvent extends BaseEvent {
  visitor_name: string;
  thumbnail_url: string;
  visit_id: string;
}

/** Emitido para `concierge:all` quando morador aprova uma visita */
export interface VisitApprovedEvent extends BaseEvent {
  visitor_name: string;
  resident_name: string;
  visit_id: string;
}

/** Emitido para `concierge:all` quando morador recusa uma visita */
export interface VisitDeniedEvent extends BaseEvent {
  visitor_name: string;
  resident_name: string;
  visit_id: string;
}

/** Emitido para `concierge:all` quando um portão/porta é aberto */
export interface GateOpenedEvent extends BaseEvent {
  access_point: string;
  actor: string;
}

/** Emitido para `concierge:all` quando câmera perde heartbeat */
export interface CameraOfflineEvent extends BaseEvent {
  camera_id: string;
  camera_name: string;
}

/** Emitido para `concierge:all` quando câmera restabelece heartbeat */
export interface CameraOnlineEvent extends BaseEvent {
  camera_id: string;
  camera_name: string;
}

/** Emitido para `concierge:all` quando porteiro aciona alerta de pânico */
export interface PanicAlertEvent extends BaseEvent {
  triggered_by: string;
}

/** Emitido para `resident:{id}` quando há chamada de interfone */
export interface IntercomCallEvent extends BaseEvent {
  access_point_id: string;
  caller_info?: string;
}

/** Emitido para `concierge:all` quando morador não atende chamada */
export interface IntercomMissedEvent extends BaseEvent {
  resident_name: string;
  unit: string;
  reason: 'offline' | 'refused' | 'timeout' | 'webrtc_failed';
}

// ---------------------------------------------------------------------------
// AccessLogUpdatedEvent (log_entry aninhado com tipo próprio)
// ---------------------------------------------------------------------------

/** Emitido para `resident:{id}` quando há novo registro no AccessLog */
export interface AccessLogUpdatedEvent extends BaseEvent {
  log_entry: {
    id: string;
    visitor_name: string;
    date: string;
    time: string;
    method: string;
    access_point: string;
  };
}

// ---------------------------------------------------------------------------
// Sync Events (catch-up após reconexão)
// ---------------------------------------------------------------------------

export interface SyncEventsRequestDto {
  last_event_id: string;
  limit?: number;
}

export interface SyncEventsResponseDto {
  events: FeedEvent[];
}

// ---------------------------------------------------------------------------
// FeedEvent — Union discriminada de todos os eventos do feed
// ---------------------------------------------------------------------------

export type FeedEvent =
  | { type: 'visitor_registered'; payload: VisitorRegisteredEvent }
  | { type: 'visit_approved'; payload: VisitApprovedEvent }
  | { type: 'visit_denied'; payload: VisitDeniedEvent }
  | { type: 'gate_opened'; payload: GateOpenedEvent }
  | { type: 'camera_offline'; payload: CameraOfflineEvent }
  | { type: 'camera_online'; payload: CameraOnlineEvent }
  | { type: 'panic_alert'; payload: PanicAlertEvent }
  | { type: 'intercom_call'; payload: IntercomCallEvent }
  | { type: 'intercom_missed'; payload: IntercomMissedEvent };

// ---------------------------------------------------------------------------
// AccessLogEntry legado (mantido para compatibilidade com DTOs existentes)
// ---------------------------------------------------------------------------

export interface AccessLogEntry {
  id: string;
  user_id: string;
  user_type: 'resident' | 'visitor' | 'concierge';
  action_type: string;
  access_point: string;
  details?: string;
  timestamp: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Mapa de tipo evento → payload (útil para tipagem genérica no gateway)
// ---------------------------------------------------------------------------

export interface WsEventMap {
  [WS_EVENTS.VISITOR_REGISTERED]: VisitorRegisteredEvent;
  [WS_EVENTS.VISIT_APPROVED]: VisitApprovedEvent;
  [WS_EVENTS.VISIT_DENIED]: VisitDeniedEvent;
  [WS_EVENTS.GATE_OPENED]: GateOpenedEvent;
  [WS_EVENTS.CAMERA_OFFLINE]: CameraOfflineEvent;
  [WS_EVENTS.CAMERA_ONLINE]: CameraOnlineEvent;
  [WS_EVENTS.PANIC_ALERT]: PanicAlertEvent;
  [WS_EVENTS.INTERCOM_CALL]: IntercomCallEvent;
  [WS_EVENTS.INTERCOM_MISSED]: IntercomMissedEvent;
  [WS_EVENTS.ACCESS_LOG_UPDATED]: AccessLogUpdatedEvent;
}
