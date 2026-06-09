import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

interface StoredEvent {
  event_id: string;
  type: string;
  payload: unknown;
  timestamp: string;
}

/**
 * EventsService — manages WebSocket event emission and event buffering.
 * Stores last 100 events in memory for catch-up on reconnection.
 */
@Injectable()
export class EventsService {
  private server: Server | null = null;
  private eventBuffer: StoredEvent[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  /**
   * Set the Socket.io server instance (called by EventsGateway after init).
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Emit an event to a specific resident's room.
   */
  emitToResident(residentId: string, event: string, payload: unknown): void {
    const enrichedPayload = this.enrichPayload(payload);
    this.bufferEvent(event, enrichedPayload);

    if (this.server) {
      this.server.to(`resident:${residentId}`).emit(event, enrichedPayload);
    }
  }

  /**
   * Emit an event to all concierge users.
   */
  emitToConcierge(event: string, payload: unknown): void {
    const enrichedPayload = this.enrichPayload(payload);
    this.bufferEvent(event, enrichedPayload);

    if (this.server) {
      this.server.to('concierge:all').emit(event, enrichedPayload);
    }
  }

  /**
   * Emit an event to all connected clients.
   */
  emitToAll(event: string, payload: unknown): void {
    const enrichedPayload = this.enrichPayload(payload);
    this.bufferEvent(event, enrichedPayload);

    if (this.server) {
      this.server.emit(event, enrichedPayload);
    }
  }

  /**
   * Get events since a given event_id for catch-up after reconnection.
   */
  getEventsSince(lastEventId: string, limit: number = 100): StoredEvent[] {
    if (!lastEventId) {
      return this.eventBuffer.slice(-limit);
    }

    const index = this.eventBuffer.findIndex(
      (e) => e.event_id === lastEventId,
    );

    if (index === -1) {
      // If event not found in buffer, return all available
      return this.eventBuffer.slice(-limit);
    }

    return this.eventBuffer.slice(index + 1, index + 1 + limit);
  }

  /**
   * Enrich payload with event_id and timestamp if not already present.
   */
  private enrichPayload(payload: unknown): Record<string, unknown> {
    const base: Record<string, unknown> =
      typeof payload === 'object' && payload !== null
        ? { ...(payload as Record<string, unknown>) }
        : { data: payload };

    if (!base.event_id) {
      base.event_id = uuidv4();
    }
    if (!base.timestamp) {
      base.timestamp = new Date().toISOString();
    }

    return base;
  }

  /**
   * Buffer an event for catch-up purposes.
   */
  private bufferEvent(type: string, payload: Record<string, unknown>): void {
    const stored: StoredEvent = {
      event_id: (payload.event_id as string) || uuidv4(),
      type,
      payload,
      timestamp: (payload.timestamp as string) || new Date().toISOString(),
    };

    this.eventBuffer.push(stored);

    // Keep buffer size within limits
    if (this.eventBuffer.length > this.MAX_BUFFER_SIZE) {
      this.eventBuffer = this.eventBuffer.slice(-this.MAX_BUFFER_SIZE);
    }
  }
}
