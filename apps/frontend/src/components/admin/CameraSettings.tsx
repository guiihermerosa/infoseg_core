'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import type { CameraDto, CameraListDto } from '@infoseg/shared';
import { Plus, Pencil, Trash2, Loader2, Wifi, WifiOff, X } from 'lucide-react';

interface CameraFormData {
  name: string;
  ip_address: string;
  onvif_port: string;
  rtsp_port: string;
  rtsp_url: string;
  connection_type: string;
  username: string;
  password: string;
  ptz_supported: boolean;
  location_zone: string;
}

const emptyForm: CameraFormData = {
  name: '',
  ip_address: '',
  onvif_port: '80',
  rtsp_port: '554',
  rtsp_url: '',
  connection_type: 'onvif',
  username: '',
  password: '',
  ptz_supported: false,
  location_zone: '',
};

export function CameraSettings() {
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CameraFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<CameraListDto>('/concierge/cameras?limit=100');
      setCameras(res.data.cameras);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  function handleNewCamera() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function handleEditCamera(camera: CameraDto) {
    setForm({
      name: camera.name,
      ip_address: camera.ip_address,
      onvif_port: String(camera.onvif_port),
      rtsp_port: String(camera.rtsp_port),
      rtsp_url: (camera as any).rtsp_url || '',
      connection_type: (camera as any).connection_type || 'onvif',
      username: '',
      password: '',
      ptz_supported: camera.ptz_supported,
      location_zone: camera.location_zone,
    });
    setEditingId(camera.id);
    setFormError(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload = {
      name: form.name,
      ip_address: form.ip_address,
      onvif_port: parseInt(form.onvif_port, 10),
      rtsp_port: parseInt(form.rtsp_port, 10),
      rtsp_url: form.rtsp_url || undefined,
      connection_type: form.connection_type,
      username: form.username,
      password: form.password,
      ptz_supported: form.ptz_supported,
      location_zone: form.location_zone,
    };

    try {
      if (editingId) {
        // Update — only send non-empty credential fields
        const updatePayload: Record<string, unknown> = { ...payload };
        if (!form.username) delete updatePayload.username;
        if (!form.password) delete updatePayload.password;
        await api.put(`/concierge/cameras/${editingId}`, updatePayload);
      } else {
        await api.post('/concierge/cameras', payload);
      }
      setShowForm(false);
      setEditingId(null);
      await fetchCameras();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr.response?.data?.message || 'Erro ao salvar câmera.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/concierge/cameras/${id}`);
      setDeleteConfirm(null);
      await fetchCameras();
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Câmeras Cadastradas</h2>
        <Button size="sm" onClick={handleNewCamera}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Câmera
        </Button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingId ? 'Editar Câmera' : 'Cadastrar Nova Câmera'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cam-name">Nome</Label>
                <Input
                  id="cam-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Portão Principal"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cam-conn">Tipo de Conexão</Label>
                <select
                  id="cam-conn"
                  value={form.connection_type}
                  onChange={(e) => setForm({ ...form, connection_type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="onvif">ONVIF</option>
                  <option value="rtsp">RTSP Direto</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cam-ip">Endereço IP</Label>
                <Input
                  id="cam-ip"
                  value={form.ip_address}
                  onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                  placeholder="192.168.1.100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cam-onvif">Porta ONVIF</Label>
                <Input
                  id="cam-onvif"
                  type="number"
                  min="1"
                  max="65535"
                  value={form.onvif_port}
                  onChange={(e) => setForm({ ...form, onvif_port: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cam-rtsp">Porta RTSP</Label>
                <Input
                  id="cam-rtsp"
                  type="number"
                  min="1"
                  max="65535"
                  value={form.rtsp_port}
                  onChange={(e) => setForm({ ...form, rtsp_port: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-full space-y-2">
                <Label htmlFor="cam-rtsp-url">URL RTSP Completa (opcional — preencha se usar conexão RTSP direto)</Label>
                <Input
                  id="cam-rtsp-url"
                  value={form.rtsp_url}
                  onChange={(e) => setForm({ ...form, rtsp_url: e.target.value })}
                  placeholder="rtsp://usuario:senha@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0"
                />
                <p className="text-xs text-muted-foreground">
                  Intelbras: rtsp://user:pass@IP:554/cam/realmonitor?channel=1&subtype=0 | Hikvision: rtsp://user:pass@IP:554/Streaming/Channels/101
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cam-user">Usuário</Label>
                <Input
                  id="cam-user"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder={editingId ? '(manter atual)' : 'admin'}
                  required={!editingId}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cam-pass">Senha</Label>
                <Input
                  id="cam-pass"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? '(manter atual)' : '••••••'}
                  required={!editingId}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cam-zone">Zona / Localização</Label>
                <Input
                  id="cam-zone"
                  value={form.location_zone}
                  onChange={(e) => setForm({ ...form, location_zone: e.target.value })}
                  placeholder="Ex: Entrada Principal"
                  maxLength={100}
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  id="cam-ptz"
                  type="checkbox"
                  checked={form.ptz_supported}
                  onChange={(e) => setForm({ ...form, ptz_supported: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="cam-ptz" className="cursor-pointer">
                  Suporta PTZ (Pan/Tilt/Zoom)
                </Label>
              </div>

              {formError && (
                <div className="col-span-full text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {formError}
                </div>
              )}

              <div className="col-span-full flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Câmera'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Camera list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : cameras.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma câmera cadastrada. Clique em "Nova Câmera" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {cameras.map((camera) => (
            <Card key={camera.id} className="relative">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{camera.name}</h3>
                    <p className="text-xs text-muted-foreground">{camera.location_zone}</p>
                  </div>
                  <Badge
                    className={
                      camera.is_online
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {camera.is_online ? (
                      <><Wifi className="h-3 w-3 mr-1" /> Online</>
                    ) : (
                      <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                    )}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>IP: <span className="font-mono">{camera.ip_address}</span></p>
                  <p>ONVIF: {camera.onvif_port} | RTSP: {camera.rtsp_port}</p>
                  <p>PTZ: {camera.ptz_supported ? 'Sim' : 'Não'}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditCamera(camera)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>

                  {deleteConfirm === camera.id ? (
                    <div className="flex gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(camera.id)}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Não
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(camera.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
