'use client';

import { useState, useEffect, useCallback } from 'react';
import { CameraPlayer } from './CameraPlayer';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';
import { WS_EVENTS } from '@infoseg/shared';
import type { CameraDto, CameraListDto, CameraOfflineEvent, CameraOnlineEvent } from '@infoseg/shared';
import api from '@/lib/api';

type LayoutMode = '1x1' | '2x2' | '3x3' | '4x4';

const LAYOUT_CONFIG: Record<LayoutMode, { cols: number; maxCameras: number }> = {
  '1x1': { cols: 1, maxCameras: 1 },
  '2x2': { cols: 2, maxCameras: 4 },
  '3x3': { cols: 3, maxCameras: 9 },
  '4x4': { cols: 4, maxCameras: 16 },
};

/**
 * Camera grid component with layout selector (1x1, 2x2, 3x3, 4x4).
 * Loads camera list from API and renders CameraPlayer components.
 * Prevents selecting more cameras than the active layout allows.
 * Uses CSS Grid with dynamic columns.
 */
export function CameraGrid() {
  const [layout, setLayout] = useState<LayoutMode>('2x2');
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineCameraIds, setOfflineCameraIds] = useState<Set<string>>(new Set());
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const { on } = useSocket();

  // Load cameras from API
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        setLoading(true);
        const response = await api.get<CameraListDto>('/concierge/cameras');
        setCameras(response.data.cameras);
        // Auto-select first cameras up to layout limit
        const maxCams = LAYOUT_CONFIG[layout].maxCameras;
        const autoSelected = response.data.cameras.slice(0, maxCams).map((c) => c.id);
        setSelectedIds(autoSelected);
      } catch {
        setCameras([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();
  }, []);

  // Listen for camera online/offline events via WebSocket
  useEffect(() => {
    const offHandler = on(WS_EVENTS.CAMERA_OFFLINE, (data: unknown) => {
      const event = data as CameraOfflineEvent;
      setOfflineCameraIds((prev) => new Set(prev).add(event.camera_id));
    });

    const onHandler = on(WS_EVENTS.CAMERA_ONLINE, (data: unknown) => {
      const event = data as CameraOnlineEvent;
      setOfflineCameraIds((prev) => {
        const next = new Set(prev);
        next.delete(event.camera_id);
        return next;
      });
    });

    return () => {
      offHandler?.();
      onHandler?.();
    };
  }, [on]);

  // When layout changes, trim selection to fit new limit
  useEffect(() => {
    const maxCams = LAYOUT_CONFIG[layout].maxCameras;
    if (selectedIds.length > maxCams) {
      setSelectedIds((prev) => prev.slice(0, maxCams));
    }
  }, [layout, selectedIds.length]);

  // Toggle camera selection
  const toggleCamera = useCallback(
    (cameraId: string) => {
      const maxCams = LAYOUT_CONFIG[layout].maxCameras;

      setSelectedIds((prev) => {
        if (prev.includes(cameraId)) {
          // Deselect
          setLimitMessage(null);
          return prev.filter((id) => id !== cameraId);
        }

        // Prevent selecting beyond limit
        if (prev.length >= maxCams) {
          setLimitMessage(`Máximo de ${maxCams} câmera(s) para o layout ${layout}.`);
          setTimeout(() => setLimitMessage(null), 3000);
          return prev;
        }

        setLimitMessage(null);
        return [...prev, cameraId];
      });
    },
    [layout]
  );

  const handleLayoutChange = (newLayout: LayoutMode) => {
    setLayout(newLayout);
    setLimitMessage(null);
  };

  const { cols, maxCameras } = LAYOUT_CONFIG[layout];
  const selectedCameras = cameras.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header with layout selector and camera picker */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Layout:</span>
          {(Object.keys(LAYOUT_CONFIG) as LayoutMode[]).map((mode) => (
            <Button
              key={mode}
              variant={layout === mode ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => handleLayoutChange(mode)}
            >
              {mode}
            </Button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {selectedIds.length}/{maxCameras} câmeras
        </span>
      </div>

      {/* Limit message */}
      {limitMessage && (
        <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1 shrink-0">
          {limitMessage}
        </div>
      )}

      {/* Camera selector (collapsed list) */}
      {cameras.length > 0 && (
        <div className="flex flex-wrap gap-1 shrink-0">
          {cameras.map((cam) => {
            const isSelected = selectedIds.includes(cam.id);
            const isDisabled = !isSelected && selectedIds.length >= maxCameras;
            return (
              <button
                key={cam.id}
                type="button"
                onClick={() => toggleCamera(cam.id)}
                disabled={isDisabled}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : isDisabled
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-foreground border-border hover:border-primary/50'
                }`}
                title={isDisabled ? `Limite de ${maxCameras} câmera(s) atingido` : cam.name}
              >
                {cam.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Camera grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Carregando câmeras...</p>
        </div>
      ) : cameras.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Nenhuma câmera cadastrada.</p>
        </div>
      ) : (
        <div
          className="flex-1 grid gap-1 min-h-0"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {selectedCameras.map((cam) => (
            <CameraPlayer
              key={cam.id}
              camera={cam}
              isOffline={offlineCameraIds.has(cam.id)}
            />
          ))}
          {/* Fill remaining slots with empty placeholders */}
          {Array.from({ length: Math.max(0, maxCameras - selectedCameras.length) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="bg-gray-900 rounded-md flex items-center justify-center border border-dashed border-gray-700"
            >
              <p className="text-gray-600 text-[10px]">Selecione uma câmera</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
