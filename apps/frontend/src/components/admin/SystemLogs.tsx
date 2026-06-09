'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface LogEntry {
  id: string;
  user_id: string;
  user_type: string;
  action_type: string;
  access_point: string;
  details: string | null;
  timestamp: string;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

const ACTION_LABELS: Record<string, string> = {
  visit_approved: 'Visita aprovada',
  visit_denied: 'Visita recusada',
  open_main_gate: 'Portão principal aberto',
  open_block_door: 'Porta bloco aberta',
  entry_release: 'Entrada liberada',
  call_resident: 'Chamada para morador',
  panic: '⚠️ ALERTA DE PÂNICO',
};

const TYPE_COLORS: Record<string, string> = {
  concierge: 'bg-purple-100 text-purple-800',
  resident: 'bg-blue-100 text-blue-800',
  visitor: 'bg-green-100 text-green-800',
};

export function SystemLogs() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const limit = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filter !== 'all') params.append('type', filter);
      const res = await api.get<LogsResponse>(`/admin/logs?${params}`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  function formatTimestamp(iso: string): string {
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-medium">Logs do Sistema</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="text-sm border rounded-md px-2 py-1.5"
          >
            <option value="all">Todos os tipos</option>
            <option value="visit_approved">Visitas aprovadas</option>
            <option value="visit_denied">Visitas recusadas</option>
            <option value="open_main_gate">Abertura portão</option>
            <option value="open_block_door">Abertura porta bloco</option>
            <option value="entry_release">Liberação entrada</option>
            <option value="call_resident">Chamadas morador</option>
            <option value="panic">Alertas de pânico</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {data ? `${data.total} registros encontrados` : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !data || data.logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum log encontrado.
            </p>
          ) : (
            <div className="space-y-1">
              {data.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/30 text-sm"
                >
                  {/* Timestamp */}
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-mono min-w-[140px]">
                    {formatTimestamp(log.timestamp)}
                  </span>

                  {/* User type badge */}
                  <Badge className={`text-[10px] shrink-0 ${TYPE_COLORS[log.user_type] || 'bg-gray-100 text-gray-800'}`}>
                    {log.user_type}
                  </Badge>

                  {/* Action */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {ACTION_LABELS[log.action_type] || log.action_type}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Ponto: {log.access_point}
                      {log.details && ` — ${log.details}`}
                    </p>
                  </div>

                  {/* Panic highlight */}
                  {log.action_type === 'panic' && (
                    <Badge className="bg-red-100 text-red-800 animate-pulse">PÂNICO</Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
