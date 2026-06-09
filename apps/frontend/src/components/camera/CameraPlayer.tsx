'use client';

import { useEffect } from 'react';
import { useCameraStream, StreamStatus } from '@/hooks/useCameraStream';
import { PtzOverlay } from './PtzOverlay';
import { Button } from '@/components/ui/button';
import type { CameraDto } from '@infoseg/shared';

interface CameraPlayerProps {
  camera: CameraDto;
  /** External override of status (e.g. from WebSocket camera_offline event) */
  isOffline?: boolean;
}

/**
 * Video player component that connects to a camera stream URL.
 * Shows status overlays: "Offline", "Carregando", "Falha de carregamento".
 * Includes retry button when stream fails.
 * For now, shows a placeholder with camera name since actual WebRTC requires MediaMTX running.
 */
export function CameraPlayer({ camera, isOffline = false }: CameraPlayerProps) {
  const { streamUrl, status, retry } = useCameraStream({
    cameraId: camera.id,
    autoConnect: !isOffline && camera.is_online,
  });

  // Determine the effective display status
  const displayStatus: StreamStatus = isOffline || !camera.is_online ? 'offline' : status;

  return (
    <div className="relative w-full h-full bg-black rounded-md overflow-hidden group">
      {/* Camera name label */}
      <div className="absolute top-1 left-1 z-10 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
        {camera.name}
      </div>

      {/* Location badge */}
      <div className="absolute top-1 right-1 z-10 bg-black/60 text-white/80 text-[10px] px-1.5 py-0.5 rounded">
        {camera.location_zone}
      </div>

      {/* Video area — placeholder since WebRTC requires MediaMTX running */}
      {displayStatus === 'connected' && streamUrl ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          {/* In production, this would be a <video> element connected via WebRTC WHEP or fMP4 MSE */}
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-600/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-green-400 text-xs">{camera.name}</p>
            <p className="text-white/50 text-[10px] mt-0.5">Stream ativo</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <StatusOverlay status={displayStatus} cameraName={camera.name} onRetry={retry} />
        </div>
      )}

      {/* PTZ overlay — shows on hover, only for cameras with ptz_supported */}
      <PtzOverlay cameraId={camera.id} ptzSupported={camera.ptz_supported} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusOverlay — renders the appropriate status overlay
// ---------------------------------------------------------------------------

interface StatusOverlayProps {
  status: StreamStatus;
  cameraName: string;
  onRetry: () => void;
}

function StatusOverlay({ status, cameraName, onRetry }: StatusOverlayProps) {
  switch (status) {
    case 'offline':
      return (
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-600/20 flex items-center justify-center">
            <span className="text-red-400 text-lg">⊘</span>
          </div>
          <p className="text-red-400 text-xs font-medium">Offline</p>
          <p className="text-white/50 text-[10px] mt-0.5">{cameraName}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-[10px] h-6 px-2 bg-transparent border-white/30 text-white/70 hover:text-white hover:border-white/50"
            onClick={onRetry}
          >
            Reconectar
          </Button>
        </div>
      );

    case 'loading':
      return (
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-yellow-600/20 flex items-center justify-center animate-spin">
            <span className="text-yellow-400 text-sm">⟳</span>
          </div>
          <p className="text-yellow-400 text-xs font-medium">Carregando</p>
          <p className="text-white/50 text-[10px] mt-0.5">{cameraName}</p>
        </div>
      );

    case 'failed':
      return (
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-orange-600/20 flex items-center justify-center">
            <span className="text-orange-400 text-lg">⚠</span>
          </div>
          <p className="text-orange-400 text-xs font-medium">Falha de carregamento</p>
          <p className="text-white/50 text-[10px] mt-0.5">{cameraName}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-[10px] h-6 px-2 bg-transparent border-white/30 text-white/70 hover:text-white hover:border-white/50"
            onClick={onRetry}
          >
            Tentar novamente
          </Button>
        </div>
      );

    case 'idle':
    default:
      return (
        <div className="text-center">
          <p className="text-white/50 text-xs">{cameraName}</p>
          <p className="text-white/30 text-[10px] mt-0.5">Aguardando conexão</p>
        </div>
      );
  }
}
