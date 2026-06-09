'use client';

import { CameraGrid } from '@/components/camera/CameraGrid';
import { QuickActions } from '@/components/concierge/QuickActions';
import { EventFeed } from '@/components/feed/EventFeed';

export default function CamerasPage() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] grid-rows-[1fr] gap-4 p-4 overflow-hidden">
      {/* Main area: Camera grid */}
      <section className="bg-card rounded-lg border border-border p-4 flex flex-col min-h-0">
        <h2 className="text-sm font-semibold text-foreground mb-3">Monitoramento de Câmeras</h2>
        <div className="flex-1 min-h-0">
          <CameraGrid />
        </div>
      </section>

      {/* Right sidebar: Quick Actions + Event Feed */}
      <aside className="flex flex-col gap-4 min-h-0 overflow-hidden">
        {/* Quick Actions panel */}
        <section className="bg-card rounded-lg border border-border p-4 shrink-0">
          <QuickActions />
        </section>

        {/* Event Feed panel */}
        <section className="bg-card rounded-lg border border-border p-4 flex-1 min-h-0 overflow-hidden">
          <EventFeed />
        </section>
      </aside>
    </div>
  );
}
