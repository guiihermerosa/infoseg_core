'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

type Step = 'email' | 'code' | 'new-password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('code');
    } catch {
      setError('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ valid: boolean }>('/auth/verify-code', { email, code });
      if (res.data.valid) {
        setStep('new-password');
      } else {
        setError('Código inválido ou expirado.');
      }
    } catch {
      setError('Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, new_password: newPassword });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-xl border-0 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600" />

      <CardHeader className="text-center pt-8 pb-2">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Recuperar Senha</h1>
            <p className="text-sm text-muted-foreground mt-1">INFOSEG CORE</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-5 mt-4">
            <p className="text-sm text-muted-foreground text-center">
              Informe seu e-mail para receber o código de recuperação.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Enviar Código
            </Button>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </form>
        )}

        {/* Step 2: Code verification */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-5 mt-4">
            <p className="text-sm text-muted-foreground text-center">
              Digite o código de 6 dígitos enviado para <strong>{email}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="h-11 text-center text-2xl tracking-[0.5em] font-bold"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading || code.length !== 6}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Verificar
            </Button>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <button type="button" onClick={() => setStep('email')} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">
              ← Tentar outro e-mail
            </button>
          </form>
        )}

        {/* Step 3: New password */}
        {step === 'new-password' && (
          <form onSubmit={handleResetPassword} className="space-y-5 mt-4">
            <p className="text-sm text-muted-foreground text-center">
              Código verificado! Defina sua nova senha.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-pass">Nova Senha</Label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirmar Senha</Label>
              <Input
                id="confirm-pass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                minLength={6}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Redefinir Senha
            </Button>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </form>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center space-y-4 mt-4 py-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="font-semibold text-lg">Senha redefinida!</h2>
            <p className="text-sm text-muted-foreground">
              Sua nova senha está ativa. Faça login para acessar.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full h-11">
              Ir para Login
            </Button>
          </div>
        )}

        {step !== 'success' && (
          <div className="mt-5 text-center">
            <a href="/login" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Voltar para login
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
