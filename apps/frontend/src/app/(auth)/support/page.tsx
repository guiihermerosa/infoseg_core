'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export default function SupportLoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    await login({ email, password });
  };

  return (
    <Card className="shadow-lg border-orange-200">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Suporte Técnico</h1>
          <p className="text-sm text-muted-foreground">INFOSEG CORE — Acesso de Manutenção</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-md bg-orange-50 border border-orange-200 text-xs text-orange-800">
            <p className="font-medium">Acesso restrito</p>
            <p>Esta é uma rota de manutenção para técnicos autorizados. Todas as ações são registradas.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-email" className="text-gray-700">
              E-mail de Suporte
            </Label>
            <Input
              id="support-email"
              type="email"
              placeholder="suporte@infoseg.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-password" className="text-gray-700">
              Senha de Suporte
            </Label>
            <Input
              id="support-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={loading}
          >
            {loading ? 'Autenticando...' : 'Entrar como Suporte'}
          </Button>

          {error && (
            <div className="text-sm text-center text-destructive mt-2" role="alert">
              <p>{error.message}</p>
            </div>
          )}

          <div className="text-center pt-2">
            <a href="/login" className="text-xs text-muted-foreground hover:text-foreground underline">
              ← Voltar para login normal
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
