'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Upload, AlertCircle } from 'lucide-react';

interface SelfieCaptureProps {
  onCapture: (blob: Blob) => void;
  onClear: () => void;
  hasPhoto: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

export function SelfieCapture({ onCapture, onClear, hasPhoto }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays on mobile browsers
        await videoRef.current.play().catch(() => {});
      }
      setCameraAvailable(true);
      setCameraError(null);
    } catch (err) {
      setCameraAvailable(false);
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setCameraError('Permissão de câmera negada. Use o upload de foto abaixo.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('Nenhuma câmera encontrada. Use o upload de foto abaixo.');
        } else {
          setCameraError('Não foi possível acessar a câmera. Use o upload de foto abaixo.');
        }
      } else {
        setCameraError('Câmera não disponível. Use o upload de foto abaixo.');
      }
    }
  }, []);

  useEffect(() => {
    if (!hasPhoto && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [hasPhoto, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedImageUrl(url);
          onCapture(blob);

          // Stop camera
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        }
      },
      'image/jpeg',
      0.85
    );
  }, [onCapture]);

  const retakePhoto = useCallback(() => {
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
      setCapturedImageUrl(null);
    }
    onClear();
    setFileError(null);
    startCamera();
  }, [capturedImageUrl, onClear, startCamera]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Formato inválido. Aceitos: JPEG, PNG ou WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Tamanho máximo: 10MB.';
    }
    return null;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setFileError(error);
      return;
    }

    setFileError(null);
    const url = URL.createObjectURL(file);
    setCapturedImageUrl(url);

    // Convert to blob for consistency
    onCapture(file);
  };

  // Photo captured — show preview
  if (hasPhoto && capturedImageUrl) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capturedImageUrl}
            alt="Foto capturada"
            className="w-full h-full object-cover"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={retakePhoto}
          className="w-full min-h-[44px]"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Tirar outra
        </Button>
      </div>
    );
  }

  // Camera available — show live preview
  if (cameraAvailable) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto overflow-hidden rounded-lg border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <Button
          type="button"
          onClick={capturePhoto}
          className="w-full min-h-[44px]"
        >
          <Camera className="mr-2 h-4 w-4" />
          Capturar
        </Button>
      </div>
    );
  }

  // Camera not available — show fallback upload
  return (
    <div className="space-y-3">
      {cameraError && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-muted text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {cameraAvailable === null && (
        <div className="flex items-center justify-center aspect-[3/4] w-full max-w-[280px] mx-auto rounded-lg border border-border bg-muted">
          <p className="text-sm text-muted-foreground">Carregando câmera...</p>
        </div>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full min-h-[44px]"
        >
          <Upload className="mr-2 h-4 w-4" />
          Enviar foto da galeria
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload de foto"
        />
        {fileError && (
          <p className="text-sm text-destructive">{fileError}</p>
        )}
      </div>
    </div>
  );
}
