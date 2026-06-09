'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';

export interface IntercomModalProps {
  /** Information about the access point triggering the call */
  accessPointId: string;
  callerInfo?: string;
  /** Called when user clicks "Atender" */
  onAnswer: () => void;
  /** Called when user clicks "Recusar" or timeout expires */
  onDecline: (reason: 'refused' | 'timeout') => void;
  /** Timeout duration in seconds (default 30) */
  timeoutSeconds?: number;
}

export function IntercomModal({
  accessPointId,
  callerInfo,
  onAnswer,
  onDecline,
  timeoutSeconds = 30,
}: IntercomModalProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(timeoutSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown timer
  useEffect(() => {
    setRemainingSeconds(timeoutSeconds);

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeoutSeconds]);

  // Auto-close on timeout
  useEffect(() => {
    if (remainingSeconds === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopRingSound();
      onDecline('timeout');
    }
  }, [remainingSeconds, onDecline]);

  // Play ring sound
  useEffect(() => {
    try {
      // Create a simple oscillator-based ring sound
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      // Pulsating ring pattern
      const pulseInterval = setInterval(() => {
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      }, 1000);

      oscillator.start();

      return () => {
        clearInterval(pulseInterval);
        oscillator.stop();
        audioContext.close();
      };
    } catch {
      // Audio not available — silently continue without sound
    }
  }, []);

  function stopRingSound() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }

  function handleAnswer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    stopRingSound();
    onAnswer();
  }

  function handleDecline() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    stopRingSound();
    onDecline('refused');
  }

  // Progress percentage for countdown ring
  const progress = (remainingSeconds / timeoutSeconds) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Chamada de interfone"
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
        {/* Ring animation */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4">
            {/* Countdown ring SVG */}
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/30"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-primary transition-all duration-1000 ease-linear"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            {/* Phone icon inside ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Phone className="h-8 w-8 animate-pulse text-primary" />
            </div>
          </div>

          <h2 className="text-lg font-semibold">Chamada de Interfone</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {callerInfo || `Ponto de acesso: ${accessPointId}`}
          </p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {remainingSeconds}s restantes
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <Button
            className="min-h-[44px] flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleAnswer}
            aria-label="Atender chamada"
          >
            <Phone className="mr-2 h-5 w-5" />
            Atender
          </Button>
          <Button
            variant="destructive"
            className="min-h-[44px] flex-1"
            onClick={handleDecline}
            aria-label="Recusar chamada"
          >
            <PhoneOff className="mr-2 h-5 w-5" />
            Recusar
          </Button>
        </div>
      </div>
    </div>
  );
}
