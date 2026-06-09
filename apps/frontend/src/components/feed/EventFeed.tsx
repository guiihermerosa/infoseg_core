'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  UserPlus,
  CheckCircle,
  XCircle,
  DoorOpen,
  VideoOff,
  Video,
  AlertTriangle,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { useSocket, type ConnectionStatus } from '@/hooks/useSocket';
import { WS_EVENTS } from '@infoseg/shared';
import type {
  FeedEvent,
  VisitorRegisteredEvent,
  VisitApprovedEvent,
  VisitDeniedEvent,
  GateOpenedEvent,
  CameraOfflineEvent,
  CameraOnlineEvent,
  PanicAlertEvent,
  SyncEventsResponseDto,
} from '@infoseg/shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ENTRIES = 100;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedEntry {
  id: string;
  type: FeedEvent['type'];
  description: string;
  timestamp: string;
  contextInfo: string;
  icon: React.ReactNode;
  iconColor: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventFeed() {
  const { status, on, setLastEventId } = useSocket();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const entryIdsRef = useRef<Set<string>>(new Set());

  // ---------------------------
  // Add entry helper (avoids duplicates, caps at 100)
  // ---------------------------

  const addEntry = useCallback((entry: FeedEntry) => {
    if (entryIdsRef.current.has(entry.id)) return;
    entryIdsRef.current.add(entry.id);

    setEntries((prev) => {
      const updated = [entry, ...prev];
      if (updated.length > MAX_ENTRIES) {
        const removed = updated.slice(MAX_ENTRIES);
        for (const r of removed) {
          entryIdsRef.current.delete(r.id);
        }
        return updated.slice(0, MAX_ENTRIES);
      }
      return updated;
    });
  }, []);

  const addEntries = useCallback((newEntries: FeedEntry[]) => {
    setEntries((prev) => {
      const existing = new Set(prev.map((e) => e.id));
      const unique = newEntries.filter((e) => !existing.has(e.id));
      if (unique.length === 0) return prev;

      for (const e of unique) {
        entryIdsRef.current.add(e.id);
      }

      // Merge and sort by timestamp descending
      const merged = [...unique, ...prev]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_ENTRIES);

      // Clean up IDs for removed entries
      const mergedIds = new Set(merged.map((e) => e.id));
      for (const id of entryIdsRef.current) {
        if (!mergedIds.has(id)) entryIdsRef.current.delete(id);
      }

      return merged;
    });
  }, []);

  // ---------------------------
  // Event → FeedEntry mappers
  // ---------------------------

  const mapEventToEntry = useCallback((feedEvent: FeedEvent): FeedEntry => {
    const { type, payload } = feedEvent;
    const base = {
      id: payload.event_id,
      type,
      timestamp: payload.timestamp,
    };

    switch (type) {
      case 'visitor_registered': {
        const p = payload as VisitorRegisteredEvent;
        return {
          ...base,
          description: 'Visitante registrado',
          contextInfo: p.visitor_name,
          icon: <UserPlus className="h-3.5 w-3.5" />,
          iconColor: 'text-blue-600',
        };
      }
      case 'visit_approved': {
        const p = payload as VisitApprovedEvent;
        return {
          ...base,
          description: 'Visita aprovada',
          contextInfo: `${p.visitor_name} (por ${p.resident_name})`,
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          iconColor: 'text-green-600',
        };
      }
      case 'visit_denied': {
        const p = payload as VisitDeniedEvent;
        return {
          ...base,
          description: 'Visita recusada',
          contextInfo: `${p.visitor_name} (por ${p.resident_name})`,
          icon: <XCircle className="h-3.5 w-3.5" />,
          iconColor: 'text-red-600',
        };
      }
      case 'gate_opened': {
        const p = payload as GateOpenedEvent;
        return {
          ...base,
          description: 'Portão aberto',
          contextInfo: `${p.access_point} — ${p.actor}`,
          icon: <DoorOpen className="h-3.5 w-3.5" />,
          iconColor: 'text-green-600',
        };
      }
      case 'camera_offline': {
        const p = payload as CameraOfflineEvent;
        return {
          ...base,
          description: 'Câmera offline',
          contextInfo: p.camera_name,
          icon: <VideoOff className="h-3.5 w-3.5" />,
          iconColor: 'text-red-600',
        };
      }
      case 'camera_online': {
        const p = payload as CameraOnlineEvent;
        return {
          ...base,
          description: 'Câmera online',
          contextInfo: p.camera_name,
          icon: <Video className="h-3.5 w-3.5" />,
          iconColor: 'text-green-600',
        };
      }
      case 'panic_alert': {
        const p = payload as PanicAlertEvent;
        return {
          ...base,
          description: 'ALERTA DE PÂNICO',
          contextInfo: `Acionado por ${p.triggered_by}`,
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          iconColor: 'text-red-600',
        };
      }
      default:
        return {
          ...base,
          description: 'Evento desconhecido',
          contextInfo: '',
          icon: <Wifi className="h-3.5 w-3.5" />,
          iconColor: 'text-gray-600',
        };
    }
  }, []);

  // ---------------------------
  // Subscribe to WebSocket events
  // ---------------------------

  useEffect(() => {
    const handleFeedEvent = (type: FeedEvent['type']) => (...args: unknown[]) => {
      const payload = args[0] as FeedEvent['payload'];
      const feedEvent = { type, payload } as FeedEvent;
      const entry = mapEventToEntry(feedEvent);
      addEntry(entry);
      setLastEventId(payload.event_id);
    };

    const unsubscribers = [
      on(WS_EVENTS.VISITOR_REGISTERED, handleFeedEvent('visitor_registered')),
      on(WS_EVENTS.VISIT_APPROVED, handleFeedEvent('visit_approved')),
      on(WS_EVENTS.VISIT_DENIED, handleFeedEvent('visit_denied')),
      on(WS_EVENTS.GATE_OPENED, handleFeedEvent('gate_opened')),
      on(WS_EVENTS.CAMERA_OFFLINE, handleFeedEvent('camera_offline')),
      on(WS_EVENTS.CAMERA_ONLINE, handleFeedEvent('camera_online')),
      on(WS_EVENTS.PANIC_ALERT, handleFeedEvent('panic_alert')),
    ];

    // Handle catch-up on reconnection
    const unsubSync = on(
      WS_EVENTS.SYNC_EVENTS_RESPONSE,
      (...args: unknown[]) => {
        const syncData = args[0] as SyncEventsResponseDto;
        if (syncData?.events?.length) {
          const newEntries = syncData.events.map(mapEventToEntry);
          addEntries(newEntries);
          // Update last event ID to the most recent one
          const lastEvent = syncData.events[syncData.events.length - 1];
          if (lastEvent) {
            setLastEventId(lastEvent.payload.event_id);
          }
        }
      }
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub?.());
      unsubSync?.();
    };
  }, [on, mapEventToEntry, addEntry, addEntries, setLastEventId]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold text-foreground">Feed de Eventos</h2>
        <ConnectionIndicator status={status} />
      </div>

      {/* Feed entries */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {entries.length === 0 ? (
          <div className="p-3 rounded-md border border-border bg-muted/50 text-sm text-muted-foreground text-center">
            Nenhum evento registrado ainda.
          </div>
        ) : (
          entries.map((entry) => (
            <EventCard key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const config = getStatusConfig(status);

  return (
    <div className="flex items-center gap-1.5">
      {status === 'reconnecting' ? (
        <Loader2 className={`h-2.5 w-2.5 animate-spin ${config.color}`} />
      ) : status === 'disconnected' ? (
        <WifiOff className={`h-3 w-3 ${config.color}`} />
      ) : (
        <span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} />
      )}
      <span className={`text-xs ${config.color}`}>{config.label}</span>
    </div>
  );
}

function EventCard({ entry }: { entry: FeedEntry }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <div className={`mt-0.5 flex-shrink-0 ${entry.iconColor}`}>
        {entry.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-tight">
          {entry.description}
        </p>
        {entry.contextInfo && (
          <p className="text-xs text-muted-foreground truncate">
            {entry.contextInfo}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
        {formatTimestamp(entry.timestamp)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusConfig(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return {
        label: 'Conectado',
        color: 'text-green-600',
        dotClass: 'bg-green-500',
      };
    case 'reconnecting':
      return {
        label: 'Reconectando',
        color: 'text-yellow-600',
        dotClass: 'bg-yellow-500',
      };
    case 'disconnected':
      return {
        label: 'Desconectado',
        color: 'text-red-600',
        dotClass: 'bg-red-500',
      };
  }
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString;
  }
}
