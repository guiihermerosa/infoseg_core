'use client';

import { useState, useEffect, useCallback } from 'react';
import { CameraGrid } from '@/components/camera/CameraGrid';
import { QuickActions } from '@/components/concierge/QuickActions';
import { EventFeed } from '@/components/feed/EventFeed';
import { useSocket } from '@/hooks/useSocket';
import { WS_EVENTS } from '@infoseg/shared';
import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IncomingCall {
  access_point_id: string;
  caller_info?: string;
  timestamp: string;
}

export default function CamerasPage() {
  const { on } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    const unsubscribe = on(WS_EVENTS.INTERCOM_CALL, (payload: unknown) => {
      const call = payload as IncomingCall;
      setIncomingCall(call);
    });
    return unsubscribe;
  }, [on]);

  function dismissCall() {
    setIncomingCall(null);
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] grid-rows-[1fr] gap-4 p-4 overflow-hidden relative">
      {/* Incoming call banner */}
      {incomingCall && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-in min-w-[350px]">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <Phone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Chamada Recebida</p>
            <p className="text-xs text-white/80">{incomingCall.caller_info || `Ponto: ${incomingCall.access_point_id}`}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissCall}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main area: Camera grid */}
      <section className="bg-card rounded-xl border border-border/60 p-4 flex flex-col min-h-0">
        <h2 className="text-sm font-semibold text-foreground mb-3">Monitoramento de Câmeras</h2>
        <div className="flex-1 min-h-0">
          <CameraGrid />
        </div>
      </section>

      {/* Right sidebar: Quick Actions + Event Feed */}
      <aside className="flex flex-col gap-4 min-h-0 overflow-hidden">
        <section className="bg-card rounded-xl border border-border/60 p-4 shrink-0">
          <QuickActions />
        </section>
        <section className="bg-card rounded-xl border border-border/60 p-4 flex-1 min-h-0 overflow-hidden">
          <EventFeed />
        </section>
      </aside>
    </div>
  );
}
