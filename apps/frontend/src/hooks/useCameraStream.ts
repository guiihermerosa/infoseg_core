'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import api from '@/lib/api';
import type { StreamResponseDto } from '@infoseg/shared';

export type StreamStatus = 'idle' | 'loading' | 'connected' | 'failed' | 'offline';

interface UseCameraStreamOptions {
  cameraId: string;
  autoConnect?: boolean;
}

interface UseCameraStreamReturn {
  streamUrl: string | null;
  protocol: 'whep' | 'fmp4' | null;
  status: StreamStatus;
  retry: () => void;
}

const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 5000;

/**
 * Hook that fetches stream URL from the Camera API and manages retry logic.
 * Handles WebRTC WHEP connection setup (simplified placeholder for now).
 * Retry logic: 3 attempts, 5s apart.
 */
export function useCameraStream({ cameraId, autoConnect = true }: UseCameraStreamOptions): UseCameraStreamReturn {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<'whep' | 'fmp4' | null>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const fetchStream = useCallback(async () => {
    if (!cameraId) return;

    setStatus('loading');

    try {
      const response = await api.get<StreamResponseDto>(`/concierge/cameras/${cameraId}/stream`);
      if (!mountedRef.current) return;

      setStreamUrl(response.data.stream_url);
      setProtocol(response.data.protocol);
      setStatus('connected');
      retriesRef.current = 0;
    } catch {
      if (!mountedRef.current) return;

      retriesRef.current += 1;

      if (retriesRef.current < MAX_RETRIES) {
        // Schedule next retry
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchStream();
          }
        }, RETRY_INTERVAL_MS);
      } else {
        setStatus('failed');
      }
    }
  }, [cameraId]);

  const retry = useCallback(() => {
    clearRetryTimeout();
    retriesRef.current = 0;
    setStatus('idle');
    fetchStream();
  }, [fetchStream, clearRetryTimeout]);

  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect && cameraId) {
      fetchStream();
    }

    return () => {
      mountedRef.current = false;
      clearRetryTimeout();
    };
  }, [cameraId, autoConnect, fetchStream, clearRetryTimeout]);

  return { streamUrl, protocol, status, retry };
}
