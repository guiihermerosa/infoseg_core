/**
 * @infoseg/shared
 * Tipos, DTOs, enums e constantes compartilhados entre apps do INFOSEG CORE.
 */

// Enums
export * from './enums';

// DTOs
export * from './dto';

// Events
export {
  WS_EVENTS,
  WS_ROOMS,
  ROOM_RESIDENT,
  ROOM_CONCIERGE,
} from './events';
export type {
  WsEventName,
  BaseEvent,
  VisitorRegisteredEvent,
  VisitApprovedEvent,
  VisitDeniedEvent,
  GateOpenedEvent,
  CameraOfflineEvent,
  CameraOnlineEvent,
  PanicAlertEvent,
  IntercomCallEvent,
  IntercomMissedEvent,
  AccessLogUpdatedEvent,
  SyncEventsRequestDto,
  SyncEventsResponseDto,
  FeedEvent,
  WsEventMap,
} from './events';
export type { AccessLogEntry as WsAccessLogEntry } from './events';

// Constants
export * from './constants';
