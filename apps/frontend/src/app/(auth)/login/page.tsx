'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (error?.retryAfter && error.retryAfter > 0) {
      setCountdown(error.retryAfter);
    }
  }, [error]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) { clearInterval(timer); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || countdown) return;
    await login({ email, password });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="shadow-xl border-0 overflow-hidden">
      {/* Green accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600" />

      <CardHeader className="text-center pt-8 pb-2">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">INFOSEG CORE</h1>
            <p className="text-sm text-muted-foreground mt-1">Portaria Remota de Condomínios</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="h-11 transition-all duration-200 focus:shadow-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
              className="h-11 transition-all duration-200 focus:shadow-md"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold shadow-md shadow-green-200 hover:shadow-lg hover:shadow-green-200 transition-all duration-200"
            disabled={loading || !!countdown}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Entrando...</>
            ) : (
              'Entrar'
            )}
          </Button>

          {error && (
            <div className="text-sm text-center text-destructive bg-destructive/5 rounded-lg p-3 animate-in" role="alert">
              {countdown ? (
                <p>Muitas tentativas. Tente em <span className="font-bold">{formatTime(countdown)}</span>.</p>
              ) : (
                <p>{error.message}</p>
              )}
            </div>
          )}
        </form>

        <div className="mt-6 pt-5 border-t text-center">
          <a href="/support" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Acesso técnico / suporte
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
