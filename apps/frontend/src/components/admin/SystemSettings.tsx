'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Loader2, Save, RefreshCw } from 'lucide-react';

interface SystemConfig {
  condominium_name: string;
  condominium_address: string;
  timezone: string;
  intercom_timeout_seconds: number;
  camera_heartbeat_interval_seconds: number;
  max_login_attempts: number;
  login_block_duration_minutes: number;
  invite_default_validity_hours: number;
  media_gateway_url: string;
  storage_type: string;
  max_image_size_mb: number;
}

interface SystemStats {
  residents: number;
  visitors: number;
  cameras: number;
  concierges: number;
  pending_visits: number;
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, statsRes] = await Promise.all([
        api.get<SystemConfig>('/admin/config'),
        api.get<SystemStats>('/admin/stats'),
      ]);
      setConfig(configRes.data);
      setStats(statsRes.data);
    } catch {
      setError('Falha ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await api.put<SystemConfig>('/admin/config', config);
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Falha ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{error || 'Configurações não disponíveis.'}</p>
        <Button variant="outline" className="mt-4" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Stats */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Visão Geral do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Moradores" value={stats.residents} />
              <StatCard label="Visitantes" value={stats.visitors} />
              <StatCard label="Câmeras" value={stats.cameras} />
              <StatCard label="Porteiros" value={stats.concierges} />
              <StatCard label="Visitas Pendentes" value={stats.pending_visits} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Condominium Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações do Condomínio</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cond-name">Nome do Condomínio</Label>
              <Input
                id="cond-name"
                value={config.condominium_name}
                onChange={(e) => setConfig({ ...config, condominium_name: e.target.value })}
                placeholder="Condomínio Residencial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cond-address">Endereço</Label>
              <Input
                id="cond-address"
                value={config.condominium_address}
                onChange={(e) => setConfig({ ...config, condominium_address: e.target.value })}
                placeholder="Rua das Flores, 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cond-tz">Fuso Horário</Label>
              <Input
                id="cond-tz"
                value={config.timezone}
                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                placeholder="America/Sao_Paulo"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Segurança e Autenticação</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sec-attempts">Máx. Tentativas de Login</Label>
              <Input
                id="sec-attempts"
                type="number"
                min="1"
                max="20"
                value={config.max_login_attempts}
                onChange={(e) => setConfig({ ...config, max_login_attempts: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sec-block">Bloqueio após Exceder (min)</Label>
              <Input
                id="sec-block"
                type="number"
                min="1"
                max="120"
                value={config.login_block_duration_minutes}
                onChange={(e) => setConfig({ ...config, login_block_duration_minutes: parseInt(e.target.value) || 15 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sec-img">Tamanho Máx. Imagem (MB)</Label>
              <Input
                id="sec-img"
                type="number"
                min="1"
                max="50"
                value={config.max_image_size_mb}
                onChange={(e) => setConfig({ ...config, max_image_size_mb: parseInt(e.target.value) || 10 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timing Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tempos e Intervalos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time-intercom">Timeout Interfone (seg)</Label>
              <Input
                id="time-intercom"
                type="number"
                min="10"
                max="120"
                value={config.intercom_timeout_seconds}
                onChange={(e) => setConfig({ ...config, intercom_timeout_seconds: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-heartbeat">Heartbeat Câmera (seg)</Label>
              <Input
                id="time-heartbeat"
                type="number"
                min="5"
                max="60"
                value={config.camera_heartbeat_interval_seconds}
                onChange={(e) => setConfig({ ...config, camera_heartbeat_interval_seconds: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-invite">Validade Padrão Convite (h)</Label>
              <Input
                id="time-invite"
                type="number"
                min="1"
                max="168"
                value={config.invite_default_validity_hours}
                onChange={(e) => setConfig({ ...config, invite_default_validity_hours: parseInt(e.target.value) || 24 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Infraestrutura</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="infra-media">URL Gateway de Mídia (MediaMTX)</Label>
              <Input
                id="infra-media"
                value={config.media_gateway_url}
                onChange={(e) => setConfig({ ...config, media_gateway_url: e.target.value })}
                placeholder="http://localhost:8889"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="infra-storage">Tipo de Storage</Label>
              <Input
                id="infra-storage"
                value={config.storage_type}
                onChange={(e) => setConfig({ ...config, storage_type: e.target.value })}
                placeholder="local ou azure"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Salvar Configurações
          </Button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">
              ✓ Configurações salvas com sucesso!
            </span>
          )}
          {error && (
            <span className="text-sm text-destructive">{error}</span>
          )}
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
