"use strict";
/**
 * WebSocket Events — Tipagem e constantes para comunicação em tempo real
 * @module @infoseg/shared/events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOM_CONCIERGE = exports.ROOM_RESIDENT = exports.WS_ROOMS = exports.WS_EVENTS = void 0;
// ---------------------------------------------------------------------------
// Constantes de nomes de eventos
// ---------------------------------------------------------------------------
exports.WS_EVENTS = {
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
};
// ---------------------------------------------------------------------------
// Rooms — helpers para nomes de salas Socket.io
// ---------------------------------------------------------------------------
exports.WS_ROOMS = {
    resident: (id) => `resident:${id}`,
    concierge: 'concierge:all',
};
/**
 * @deprecated Use WS_ROOMS.resident(id) instead
 */
const ROOM_RESIDENT = (id) => `resident:${id}`;
exports.ROOM_RESIDENT = ROOM_RESIDENT;
/**
 * @deprecated Use WS_ROOMS.concierge instead
 */
exports.ROOM_CONCIERGE = 'concierge:all';
//# sourceMappingURL=index.js.map