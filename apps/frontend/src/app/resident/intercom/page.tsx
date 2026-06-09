'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { IntercomModal } from '@/components/intercom/IntercomModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WS_EVENTS } from '@infoseg/shared';
import type { IntercomCallEvent } from '@infoseg/shared';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

type IntercomState = 'idle' | 'ringing' | 'in_call' | 'permission_error';

interface IncomingCall {
  accessPointId: string;
  callerInfo?: string;
}

export default function ResidentIntercomPage() {
  const [state, setState] = useState<IntercomState>('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  const { on, emit, setLastEventId } = useSocket();
  const callActiveRef = useRef(false);

  // Listen for intercom_call events
  useEffect(() => {
    const unsubscribe = on(WS_EVENTS.INTERCOM_CALL, (payload: unknown) => {
      const event = payload as IntercomCallEvent;
      if (event.event_id) {
        setLastEventId(event.event_id);
      }

      // Discard new calls while modal is active (Requirement 6.3)
      if (callActiveRef.current) {
        return;
      }

      callActiveRef.current = true;
      setIncomingCall({
        accessPointId: event.access_point_id,
        callerInfo: event.caller_info,
      });
      setState('ringing');
    });

    return unsubscribe;
  }, [on, setLastEventId]);

  // Handle "Atender" — request permissions and start WebRTC placeholder
  const handleAnswer = useCallback(async () => {
    setState('in_call');
    setPermissionError(null);

    try {
      // Request microphone permission (mandatory per Requirement 6.7)
      const constraints: MediaStreamConstraints = { audio: true, video: true };
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        setHasAudio(true);
        setHasVideo(true);
      } catch {
        // Try audio-only if video is denied (Requirement 6.7)
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasAudio(true);
          setHasVideo(false);
        } catch {
          // Microphone denied — cannot proceed (Requirement 6.7)
          setPermissionError(
            'Interfone não disponível sem acesso ao microfone. Permita o acesso e tente novamente.'
          );
          setState('permission_error');
          callActiveRef.current = false;

          // Emit intercom_missed
          emit(WS_EVENTS.INTERCOM_MISSED, {
            reason: 'refused',
          });
          return;
        }
      }

      // Placeholder: in a real implementation, WebRTC signaling would happen here
      // For now, we hold the "in call" state until user ends it
      // Clean up stream tracks when done
      stream.getTracks().forEach((track) => {
        // Keep tracks alive for call duration — they'll be stopped on end call
      });
    } catch {
      setPermissionError('Erro ao iniciar chamada. Tente novamente.');
      setState('permission_error');
      callActiveRef.current = false;
    }
  }, [emit]);

  // Handle "Recusar" or timeout
  const handleDecline = useCallback(
    (reason: 'refused' | 'timeout') => {
      setState('idle');
      setIncomingCall(null);
      callActiveRef.current = false;

      // Notify server so it can emit intercom_missed to concierge
      emit(WS_EVENTS.INTERCOM_MISSED, { reason });
    },
    [emit]
  );

  // End call
  function handleEndCall() {
    setState('idle');
    setIncomingCall(null);
    setHasAudio(false);
    setHasVideo(false);
    callActiveRef.current = false;
  }

  // Reset from permission error
  function handleDismissError() {
    setState('idle');
    setIncomingCall(null);
    setPermissionError(null);
    callActiveRef.current = false;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold md:text-2xl">Interfone Virtual</h1>

      {/* Ringing state — show IntercomModal */}
      {state === 'ringing' && incomingCall && (
        <IntercomModal
          accessPointId={incomingCall.accessPointId}
          callerInfo={incomingCall.callerInfo}
          onAnswer={handleAnswer}
          onDecline={handleDecline}
          timeoutSeconds={30}
        />
      )}

      {/* In call state — placeholder WebRTC UI */}
      {state === 'in_call' && (
        <Card className="border-primary">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="flex h-48 w-full items-center justify-center rounded-lg bg-muted">
              <p className="text-lg font-medium text-muted-foreground">
                Chamada em andamento
              </p>
            </div>

            {/* Media status indicators */}
            <div className="flex items-center gap-4">
              {hasAudio ? (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Mic className="h-4 w-4" />
                  <span>Áudio ativo</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MicOff className="h-4 w-4" />
                  <span>Sem áudio</span>
                </div>
              )}
              {hasVideo ? (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Video className="h-4 w-4" />
                  <span>Vídeo ativo</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <VideoOff className="h-4 w-4" />
                  <span>Sem vídeo</span>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {incomingCall?.callerInfo || `Ponto de acesso: ${incomingCall?.accessPointId}`}
            </p>

            <Button
              variant="destructive"
              className="min-h-[44px]"
              onClick={handleEndCall}
              aria-label="Encerrar chamada"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              Encerrar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Permission error state */}
      {state === 'permission_error' && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <MicOff className="h-12 w-12 text-destructive" />
            <p className="text-center font-medium text-destructive">
              {permissionError}
            </p>
            <Button variant="outline" className="min-h-[44px]" onClick={handleDismissError}>
              Entendido
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Idle state */}
      {state === 'idle' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 py-12">
            <Phone className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-lg text-muted-foreground">
              Aguardando chamadas...
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Quando alguém acionar o interfone da sua unidade, a chamada aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
