'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitorForm } from '@/components/visitor/VisitorForm';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

type PageState =
  | { status: 'loading' }
  | { status: 'valid'; validUntil: string }
  | { status: 'expired' }
  | { status: 'used' }
  | { status: 'error'; message: string }
  | { status: 'success' };

const EXPIRATION_CHECK_INTERVAL = 30_000; // Check every 30 seconds

export default function VisitorPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<PageState>({ status: 'loading' });
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const expirationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const validUntilRef = useRef<string | null>(null);

  const checkExpiration = useCallback(() => {
    if (!validUntilRef.current) return;
    const now = new Date();
    const expiry = new Date(validUntilRef.current);
    if (now >= expiry) {
      setIsTokenExpired(true);
      if (expirationTimerRef.current) {
        clearInterval(expirationTimerRef.current);
        expirationTimerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/visitor/invite/${token}`, {
          headers: { 'Accept': 'application/json' },
        });

        if (response.status === 410) {
          setState({ status: 'expired' });
          return;
        }

        if (response.status === 409) {
          setState({ status: 'used' });
          return;
        }

        if (!response.ok) {
          setState({ status: 'error', message: 'Erro ao carregar convite.' });
          return;
        }

        const data = await response.json();
        validUntilRef.current = data.valid_until;
        setState({ status: 'valid', validUntil: data.valid_until });

        // Check if already expired
        const now = new Date();
        const expiry = new Date(data.valid_until);
        if (now >= expiry) {
          setIsTokenExpired(true);
        }
      } catch {
        setState({ status: 'error', message: 'Erro de conexão. Verifique sua internet.' });
      }
    };

    fetchInvite();
  }, [token]);

  // Periodic expiration check
  useEffect(() => {
    if (state.status === 'valid' && !isTokenExpired) {
      expirationTimerRef.current = setInterval(checkExpiration, EXPIRATION_CHECK_INTERVAL);
      return () => {
        if (expirationTimerRef.current) {
          clearInterval(expirationTimerRef.current);
        }
      };
    }
  }, [state.status, isTokenExpired, checkExpiration]);

  const handleSubmitSuccess = () => {
    setState({ status: 'success' });
  };

  return (
    <main className="min-h-screen bg-muted flex items-start justify-center p-4 pt-8 sm:pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl">
            Registro de Visitante
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Carregando convite...</p>
            </div>
          )}

          {state.status === 'expired' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Convite expirado</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Este link de convite já expirou. Solicite um novo convite ao morador.
                </p>
              </div>
            </div>
          )}

          {state.status === 'used' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Convite já utilizado</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Este convite já foi utilizado para um registro anterior.
                </p>
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h2 className="text-lg font-semibold">Erro</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {state.message}
                </p>
              </div>
            </div>
          )}

          {state.status === 'valid' && (
            <VisitorForm
              token={token}
              onSubmitSuccess={handleSubmitSuccess}
              isExpired={isTokenExpired}
            />
          )}

          {state.status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Registro concluído!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Seus dados foram enviados com sucesso. Aguarde a liberação pelo morador.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
