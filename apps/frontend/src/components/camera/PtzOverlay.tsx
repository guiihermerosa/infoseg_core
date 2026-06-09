'use client';

import { useCallback, useState } from 'react';
import { usePtz } from '@/hooks/usePtz';
import type { PtzCommandDto } from '@infoseg/shared';

type PtzCommandType = PtzCommandDto['command'];

interface PtzOverlayProps {
  cameraId: string;
  ptzSupported: boolean;
}

/**
 * Semi-transparent overlay with directional and zoom PTZ controls.
 * Only visible when camera.ptz_supported === true.
 * Positioned to not exceed 15% of player area.
 * Directional buttons send single commands on click.
 * Zoom buttons send continuous commands every 200ms while held.
 */
export function PtzOverlay({ cameraId, ptzSupported }: PtzOverlayProps) {
  const { sendCommand, startContinuous, stopContinuous } = usePtz();
  const [error, setError] = useState<string | null>(null);

  // Don't render if PTZ not supported
  if (!ptzSupported) return null;

  const handleDirectionalClick = async (command: PtzCommandType) => {
    setError(null);
    const result = await sendCommand(cameraId, command);
    if (!result.success) {
      setError(result.error || 'Erro no comando PTZ');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleZoomStart = (command: PtzCommandType) => {
    setError(null);
    startContinuous(cameraId, command);
  };

  const handleZoomEnd = () => {
    stopContinuous();
  };

  return (
    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
      {/* PTZ control cluster — max 15% of player area, centered bottom */}
      <div className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 max-w-[15%] max-h-[15%]">
        {/* Directional pad */}
        <div className="flex flex-col items-center">
          <PtzButton
            label="↑"
            title="Mover para cima"
            onClick={() => handleDirectionalClick('up')}
          />
          <div className="flex gap-0.5">
            <PtzButton
              label="←"
              title="Mover para esquerda"
              onClick={() => handleDirectionalClick('left')}
            />
            <PtzButton
              label="→"
              title="Mover para direita"
              onClick={() => handleDirectionalClick('right')}
            />
          </div>
          <PtzButton
            label="↓"
            title="Mover para baixo"
            onClick={() => handleDirectionalClick('down')}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex gap-1 mt-0.5">
          <PtzButton
            label="+"
            title="Zoom in (manter pressionado)"
            onMouseDown={() => handleZoomStart('zoom_in')}
            onMouseUp={handleZoomEnd}
            onMouseLeave={handleZoomEnd}
            onTouchStart={() => handleZoomStart('zoom_in')}
            onTouchEnd={handleZoomEnd}
          />
          <PtzButton
            label="−"
            title="Zoom out (manter pressionado)"
            onMouseDown={() => handleZoomStart('zoom_out')}
            onMouseUp={handleZoomEnd}
            onMouseLeave={handleZoomEnd}
            onTouchStart={() => handleZoomStart('zoom_out')}
            onTouchEnd={handleZoomEnd}
          />
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-xs px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PtzButton — small transparent button used in the overlay
// ---------------------------------------------------------------------------

interface PtzButtonProps {
  label: string;
  title: string;
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
}

function PtzButton({ label, title, onClick, onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd }: PtzButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="w-7 h-7 flex items-center justify-center rounded bg-black/50 text-white text-xs font-bold hover:bg-black/70 active:bg-black/80 transition-colors select-none touch-none"
    >
      {label}
    </button>
  );
}
