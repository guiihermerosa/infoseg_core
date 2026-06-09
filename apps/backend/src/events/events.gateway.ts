import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WS_ROOMS, WS_EVENTS, SyncEventsRequestDto } from '@infoseg/shared';
import { EventsService } from './events.service';

interface JwtPayload {
  sub: string;
  role: 'resident' | 'concierge';
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly eventsService: EventsService,
  ) {}

  afterInit(server: Server): void {
    this.eventsService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: no token provided`);
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);

      // Assign client to appropriate room based on role
      if (payload.role === 'resident') {
        const room = WS_ROOMS.resident(payload.sub);
        await client.join(room);
        this.logger.log(`Resident ${payload.sub} joined room ${room}`);
      } else if (payload.role === 'concierge') {
        await client.join(WS_ROOMS.concierge);
        this.logger.log(`Concierge ${payload.sub} joined room ${WS_ROOMS.concierge}`);
      } else {
        this.logger.warn(`Client ${client.id} disconnected: unknown role`);
        client.disconnect(true);
        return;
      }

      // Store user info on the socket for later use
      (client as Socket & { user?: JwtPayload }).user = payload;
    } catch (error) {
      this.logger.warn(`Client ${client.id} disconnected: invalid token — ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(WS_EVENTS.SYNC_EVENTS)
  handleSyncEvents(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SyncEventsRequestDto,
  ): void {
    const lastEventId = data?.last_event_id || '';
    const limit = data?.limit || 100;

    const missedEvents = this.eventsService.getEventsSince(lastEventId, limit);

    client.emit(WS_EVENTS.SYNC_EVENTS_RESPONSE, { events: missedEvents });
  }

  /**
   * Extract the JWT token from the client handshake.
   * Supports both `client.handshake.auth.token` and `Authorization` header.
   */
  private extractToken(client: Socket): string | null {
    // Try auth object first (recommended approach)
    const authToken = client.handshake?.auth?.token as string | undefined;
    if (authToken) {
      // Remove "Bearer " prefix if present
      return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
    }

    // Fallback: Authorization header
    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }
}
