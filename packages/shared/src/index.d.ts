/**
 * @infoseg/shared
 * Tipos, DTOs, enums e constantes compartilhados entre apps do INFOSEG CORE.
 */
export * from './enums';
export * from './dto';
export { WS_EVENTS, WS_ROOMS, ROOM_RESIDENT, ROOM_CONCIERGE, } from './events';
export type { WsEventName, BaseEvent, VisitorRegisteredEvent, VisitApprovedEvent, VisitDeniedEvent, GateOpenedEvent, CameraOfflineEvent, CameraOnlineEvent, PanicAlertEvent, IntercomCallEvent, IntercomMissedEvent, AccessLogUpdatedEvent, SyncEventsRequestDto, SyncEventsResponseDto, FeedEvent, WsEventMap, } from './events';
export type { AccessLogEntry as WsAccessLogEntry } from './events';
export * from './constants';
//# sourceMappingURL=index.d.ts.map