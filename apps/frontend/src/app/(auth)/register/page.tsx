'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function RegisterConciergePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (form.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (form.name.trim().length < 3) {
      setError('O nome deve ter no mínimo 3 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register-concierge', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <h2 className="text-lg font-semibold">Cadastro realizado!</h2>
          <p className="text-sm text-muted-foreground">
            Seu acesso como porteiro foi criado com sucesso. Faça login para acessar o sistema.
          </p>
          <Button onClick={() => router.push('/login')} className="mt-2">
            Ir para Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Cadastro de Porteiro</h1>
          <p className="text-sm text-muted-foreground">INFOSEG CORE — Portaria Remota</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Nome Completo</Label>
            <Input
              id="reg-name"
              type="text"
              placeholder="Seu nome completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={3}
              maxLength={150}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email">E-mail</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-phone">Telefone</Label>
            <Input
              id="reg-phone"
              type="tel"
              placeholder="11999990000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              minLength={8}
              maxLength={20}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password">Senha</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-confirm">Confirmar Senha</Label>
            <Input
              id="reg-confirm"
              type="password"
              placeholder="Repita a senha"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={6}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>

          {error && (
            <div className="text-sm text-center text-destructive mt-2" role="alert">
              <p>{error}</p>
            </div>
          )}

          <div className="text-center pt-2 space-y-1">
            <a href="/login" className="text-sm text-primary hover:underline block">
              Já tem conta? Faça login
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
