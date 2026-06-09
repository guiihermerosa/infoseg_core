'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Loader2, X, MapPin } from 'lucide-react';

interface CommonArea {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  rules: string | null;
  is_active: boolean;
}

interface AreaFormData {
  name: string;
  description: string;
  capacity: string;
  rules: string;
}

const emptyForm: AreaFormData = { name: '', description: '', capacity: '20', rules: '' };

export function CommonAreaSettings() {
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AreaFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ areas: CommonArea[] }>('/admin/common-areas');
      setAreas(res.data.areas);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  function handleNew() { setForm(emptyForm); setEditingId(null); setFormError(null); setShowForm(true); }

  function handleEdit(area: CommonArea) {
    setForm({
      name: area.name,
      description: area.description || '',
      capacity: String(area.capacity),
      rules: area.rules || '',
    });
    setEditingId(area.id);
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
      capacity: parseInt(form.capacity, 10) || 20,
      rules: form.rules || undefined,
    };
    try {
      if (editingId) {
        await api.put(`/admin/common-areas/${editingId}`, payload);
      } else {
        await api.post('/admin/common-areas', payload);
      }
      setShowForm(false);
      setEditingId(null);
      await fetchAreas();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este local?')) return;
    try { await api.delete(`/admin/common-areas/${id}`); await fetchAreas(); } catch { /* */ }
  }

  async function handleToggleActive(area: CommonArea) {
    try {
      await api.put(`/admin/common-areas/${area.id}`, { is_active: !area.is_active });
      await fetchAreas();
    } catch { /* */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Locais para Reserva</h2>
        <Button size="sm" onClick={handleNew}><Plus className="h-4 w-4 mr-1" />Novo Local</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 animate-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editingId ? 'Editar Local' : 'Novo Local'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Local</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Churrasqueira 1" required />
              </div>
              <div className="space-y-2">
                <Label>Capacidade (pessoas)</Label>
                <Input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
              </div>
              <div className="col-span-full space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Churrasqueira coberta com piscina" />
              </div>
              <div className="col-span-full space-y-2">
                <Label>Regras (opcional)</Label>
                <Input value={form.rules} onChange={e => setForm({...form, rules: e.target.value})} placeholder="Horário máximo: 22h. Limpeza obrigatória." />
              </div>
              {formError && <p className="col-span-full text-sm text-destructive">{formError}</p>}
              <div className="col-span-full flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {editingId ? 'Salvar' : 'Criar Local'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : areas.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum local cadastrado. Clique em "Novo Local" para criar.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {areas.map(area => (
            <Card key={area.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-sm">{area.name}</h3>
                  </div>
                  <Badge className={area.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                    {area.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                {area.description && <p className="text-xs text-muted-foreground">{area.description}</p>}
                <p className="text-xs text-muted-foreground">Capacidade: {area.capacity} pessoas</p>
                {area.rules && <p className="text-xs text-muted-foreground italic">{area.rules}</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(area)}>
                    <Pencil className="h-3 w-3 mr-1" />Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleActive(area)}>
                    {area.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(area.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
