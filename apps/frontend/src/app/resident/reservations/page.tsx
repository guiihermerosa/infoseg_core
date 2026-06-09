'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { CalendarDays, Plus, Loader2, MapPin } from 'lucide-react';

interface CommonArea {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
}

interface Reservation {
  id: string;
  area_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

export default function ReservationsPage() {
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedArea, setSelectedArea] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [areasRes, reservationsRes] = await Promise.all([
        api.get<{ areas: CommonArea[] }>('/resident/common-areas'),
        api.get<{ reservations: Reservation[] }>('/resident/reservations'),
      ]);
      setAreas(areasRes.data.areas);
      setReservations(reservationsRes.data.reservations);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/resident/reservations', {
        common_area_id: selectedArea,
        date,
        start_time: startTime,
        end_time: endTime,
        notes: notes || undefined,
      });
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setSelectedArea(''); setDate(''); setStartTime(''); setEndTime(''); setNotes('');
      await fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erro ao reservar.');
    } finally {
      setSubmitting(false);
    }
  }

  function getMinDate() {
    return new Date().toISOString().split('T')[0];
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reservas</h1>
          <p className="text-sm text-muted-foreground">Agende churrasqueiras, quiosques e salão de festas</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Reserva
        </Button>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 animate-in">
          ✓ Reserva confirmada com sucesso!
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-primary/20 animate-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nova Reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Espaço</Label>
                <select
                  value={selectedArea}
                  onChange={e => setSelectedArea(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">Selecione o espaço...</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (até {a.capacity} pessoas)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={getMinDate()} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Término</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: aniversário, 15 convidados" maxLength={255} />
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarDays className="h-4 w-4 mr-2" />}
                Confirmar Reserva
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Available areas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {areas.map(area => (
          <Card key={area.id} className="text-center p-4">
            <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">{area.name}</p>
            <p className="text-xs text-muted-foreground">Até {area.capacity} pessoas</p>
          </Card>
        ))}
      </div>

      {/* My reservations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Minhas Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma reserva encontrada.</p>
          ) : (
            <div className="space-y-2">
              {reservations.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{r.area_name}</p>
                    <p className="text-xs text-muted-foreground">{r.date} • {r.start_time} — {r.end_time}</p>
                    {r.notes && <p className="text-xs text-muted-foreground mt-0.5">{r.notes}</p>}
                  </div>
                  <Badge className={r.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                    {r.status === 'confirmed' ? 'Confirmada' : r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
