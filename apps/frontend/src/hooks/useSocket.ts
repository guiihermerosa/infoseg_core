'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { WS_EVENTS } from '@infoseg/shared';
import type { SyncEventsRequestDto } from '@infoseg/shared';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const lastEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      // Catch-up after reconnection
      if (lastEventIdRef.current) {
        const syncRequest: SyncEventsRequestDto = {
          last_event_id: lastEventIdRef.current,
          limit: 100,
        };
        socket.emit(WS_EVENTS.SYNC_EVENTS, syncRequest);
      }
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('reconnect_attempt', () => {
      setStatus('reconnecting');
    });

    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const setLastEventId = useCallback((id: string) => {
    lastEventIdRef.current = id;
  }, []);

  return { status, on, emit, setLastEventId, socket: socketRef.current };
}
