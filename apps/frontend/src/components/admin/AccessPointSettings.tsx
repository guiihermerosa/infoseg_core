'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Loader2, X, Zap, Wifi, WifiOff } from 'lucide-react';

interface AccessPoint {
  id: string;
  name: string;
  description: string | null;
  protocol: string;
  ip_address: string;
  port: number;
  endpoint_path: string | null;
  username: string | null;
  password: string | null;
  relay_channel: number;
  pulse_duration: number;
  is_online: boolean;
}

interface APFormData {
  name: string;
  description: string;
  protocol: string;
  ip_address: string;
  port: string;
  endpoint_path: string;
  username: string;
  password: string;
  relay_channel: string;
  pulse_duration: string;
}

const PROTOCOLS = [
  { value: 'http_get', label: 'HTTP GET' },
  { value: 'http_post', label: 'HTTP POST' },
  { value: 'tcp_socket', label: 'TCP Socket (Relé Serial)' },
  { value: 'intelbras_api', label: 'Intelbras (CGI API)' },
  { value: 'onvif_output', label: 'ONVIF Digital Output' },
];

const emptyForm: APFormData = {
  name: '',
  description: '',
  protocol: 'http_get',
  ip_address: '',
  port: '80',
  endpoint_path: '',
  username: '',
  password: '',
  relay_channel: '1',
  pulse_duration: '1000',
};

export function AccessPointSettings() {
  const [points, setPoints] = useState<AccessPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<APFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<AccessPoint[]>('/admin/access-points');
      setPoints(res.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  function handleNew() { setForm(emptyForm); setEditingId(null); setFormError(null); setShowForm(true); }

  function handleEdit(ap: AccessPoint) {
    setForm({
      name: ap.name,
      description: ap.description || '',
      protocol: ap.protocol,
      ip_address: ap.ip_address,
      port: String(ap.port),
      endpoint_path: ap.endpoint_path || '',
      username: ap.username || '',
      password: ap.password || '',
      relay_channel: String(ap.relay_channel),
      pulse_duration: String(ap.pulse_duration),
    });
    setEditingId(ap.id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const payload = {
      name: form.name,
      description: form.description || undefined,
      protocol: form.protocol,
      ip_address: form.ip_address,
      port: parseInt(form.port, 10),
      endpoint_path: form.endpoint_path || undefined,
      username: form.username || undefined,
      password: form.password || undefined,
      relay_channel: parseInt(form.relay_channel, 10),
      pulse_duration: parseInt(form.pulse_duration, 10),
    };
    try {
      if (editingId) {
        await api.put(`/admin/access-points/${editingId}`, payload);
      } else {
        await api.post('/admin/access-points', payload);
      }
      setShowForm(false);
      setEditingId(null);
      await fetchPoints();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try { await api.delete(`/admin/access-points/${id}`); await fetchPoints(); } catch { /* */ }
  }

  async function handleTrigger(id: string) {
    setTriggeringId(id);
    setTriggerResult(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/admin/access-points/${id}/trigger`);
      setTriggerResult({ id, msg: res.data.message, ok: res.data.success });
    } catch (err: any) {
      setTriggerResult({ id, msg: err.response?.data?.message || 'Falha ao acionar.', ok: false });
    } finally {
      setTriggeringId(null);
      setTimeout(() => setTriggerResult(null), 5000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Pontos de Acesso (Relés / Portas)</h2>
        <Button size="sm" onClick={handleNew}><Plus className="h-4 w-4 mr-1" />Novo Ponto</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editingId ? 'Editar Ponto' : 'Novo Ponto de Acesso'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Portão Principal" required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Portão de entrada do condomínio" />
              </div>
              <div className="space-y-2">
                <Label>Protocolo</Label>
                <select value={form.protocol} onChange={e => setForm({...form, protocol: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm">
                  {PROTOCOLS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>IP do Controlador</Label>
                <Input value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} placeholder="192.168.1.200" required />
              </div>
              <div className="space-y-2">
                <Label>Porta</Label>
                <Input type="number" value={form.port} onChange={e => setForm({...form, port: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Endpoint / Path (opcional)</Label>
                <Input value={form.endpoint_path} onChange={e => setForm({...form, endpoint_path: e.target.value})} placeholder="/cgi-bin/openDoor.cgi" />
              </div>
              <div className="space-y-2">
                <Label>Usuário (opcional)</Label>
                <Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label>Senha (opcional)</Label>
                <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label>Canal do Relé</Label>
                <Input type="number" min="1" max="16" value={form.relay_channel} onChange={e => setForm({...form, relay_channel: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Duração do Pulso (ms)</Label>
                <Input type="number" min="100" max="10000" value={form.pulse_duration} onChange={e => setForm({...form, pulse_duration: e.target.value})} />
              </div>

              {formError && <div className="col-span-full text-sm text-destructive bg-destructive/10 p-2 rounded">{formError}</div>}

              <div className="col-span-full flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : points.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum ponto de acesso cadastrado.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {points.map(ap => (
            <Card key={ap.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{ap.name}</h3>
                    <p className="text-xs text-muted-foreground">{ap.description || ap.protocol}</p>
                  </div>
                  <Badge className={ap.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                    {ap.is_online ? <><Wifi className="h-3 w-3 mr-1" />Ativo</> : <><WifiOff className="h-3 w-3 mr-1" />Inativo</>}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Protocolo: <span className="font-medium">{PROTOCOLS.find(p => p.value === ap.protocol)?.label || ap.protocol}</span></p>
                  <p>IP: <span className="font-mono">{ap.ip_address}:{ap.port}</span></p>
                  <p>Canal: {ap.relay_channel} | Pulso: {ap.pulse_duration}ms</p>
                </div>
                {triggerResult?.id === ap.id && (
                  <div className={`text-xs p-1.5 rounded ${triggerResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {triggerResult.msg}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="default" size="sm" className="flex-1" onClick={() => handleTrigger(ap.id)} disabled={triggeringId === ap.id}>
                    {triggeringId === ap.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                    Testar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(ap)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(ap.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
