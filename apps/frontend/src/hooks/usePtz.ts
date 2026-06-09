'use client';

import { useCallback, useRef } from 'react';
import api from '@/lib/api';
import type { PtzCommandDto } from '@infoseg/shared';

type PtzCommandType = PtzCommandDto['command'];

interface UsePtzReturn {
  /** Send a single PTZ command (click) */
  sendCommand: (cameraId: string, command: PtzCommandType) => Promise<{ success: boolean; error?: string }>;
  /** Start continuous command sending (for zoom hold, every 200ms) */
  startContinuous: (cameraId: string, command: PtzCommandType) => void;
  /** Stop continuous command sending */
  stopContinuous: () => void;
}

const CONTINUOUS_INTERVAL_MS = 200;

/**
 * Hook for PTZ command sending.
 * - sendCommand: sends a single discrete PTZ command
 * - startContinuous + stopContinuous: for zoom press-and-hold (sends every 200ms)
 */
export function usePtz(): UsePtzReturn {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendCommand = useCallback(async (cameraId: string, command: PtzCommandType): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload: PtzCommandDto = { command };
      await api.post(`/concierge/cameras/${cameraId}/ptz`, payload);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao enviar comando PTZ';
      return { success: false, error: errorMessage };
    }
  }, []);

  const startContinuous = useCallback((cameraId: string, command: PtzCommandType) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Send first command immediately
    sendCommand(cameraId, command);

    // Then send every 200ms
    intervalRef.current = setInterval(() => {
      sendCommand(cameraId, command);
    }, CONTINUOUS_INTERVAL_MS);
  }, [sendCommand]);

  const stopContinuous = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { sendCommand, startContinuous, stopContinuous };
}
