'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { getUserRole } from '@/lib/auth';
import { Plus, Pencil, Trash2, Loader2, X, Shield, Home } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'resident' | 'concierge';
  apartment_number?: string;
  block?: string;
  created_at: string;
}

type UserRole = 'resident' | 'concierge';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  apartment_number: string;
  block: string;
}

const emptyForm: UserFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'resident',
  apartment_number: '',
  block: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function UserManagement() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');

  // Porteiros só veem moradores. Suporte vê tudo.
  const currentRole = getUserRole();
  const isSupportUser = currentRole === 'support';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<UserListItem[]>('/admin/users');
      // Se não é suporte, filtrar para mostrar apenas moradores
      const filtered = isSupportUser ? res.data : res.data.filter((u) => u.role === 'resident');
      setUsers(filtered);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isSupportUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  function handleNewUser() {
    setForm(emptyForm);
    setEditingUser(null);
    setFormError(null);
    setShowForm(true);
  }

  function handleEditUser(user: UserListItem) {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '',
      role: user.role,
      apartment_number: user.apartment_number || '',
      block: user.block || '',
    });
    setEditingUser(user);
    setFormError(null);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingUser(null);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          phone: form.phone,
        };
        if (form.password) payload.password = form.password;

        if (editingUser.role === 'resident') {
          payload.apartment_number = form.apartment_number;
          payload.block = form.block;
          await api.put(`/admin/residents/${editingUser.id}`, payload);
        } else {
          await api.put(`/admin/concierges/${editingUser.id}`, payload);
        }
      } else {
        // Create new user
        if (form.role === 'resident') {
          await api.post('/admin/residents', {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            apartment_number: form.apartment_number,
            block: form.block,
          });
        } else {
          await api.post('/admin/concierges', {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
          });
        }
      }

      setShowForm(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr.response?.data?.message || 'Erro ao salvar usuário.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(user: UserListItem) {
    try {
      if (user.role === 'resident') {
        await api.delete(`/admin/residents/${user.id}`);
      } else {
        await api.delete(`/admin/concierges/${user.id}`);
      }
      setDeleteConfirm(null);
      await fetchUsers();
    } catch {
      // silent
    }
  }

  // ─── Filtered users ─────────────────────────────────────────────────────

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter((u) => u.role === filterRole);

  const residentsCount = users.filter((u) => u.role === 'resident').length;
  const conciergesCount = users.filter((u) => u.role === 'concierge').length;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Usuários do Sistema</h2>
          <Badge variant="outline">{residentsCount} moradores</Badge>
          <Badge variant="outline">{conciergesCount} porteiros</Badge>
        </div>
        <Button size="sm" onClick={handleNewUser}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Usuário
        </Button>
      </div>

      {/* Filter — only visible for support users */}
      {isSupportUser && (
      <div className="flex gap-2">
        <Button
          variant={filterRole === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterRole('all')}
        >
          Todos ({users.length})
        </Button>
        <Button
          variant={filterRole === 'resident' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterRole('resident')}
        >
          <Home className="h-3 w-3 mr-1" />
          Moradores ({residentsCount})
        </Button>
        <Button
          variant={filterRole === 'concierge' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterRole('concierge')}
        >
          <Shield className="h-3 w-3 mr-1" />
          Porteiros ({conciergesCount})
        </Button>
      </div>
      )}

      {/* Form - Create/Edit */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingUser ? `Editar: ${editingUser.name}` : 'Cadastrar Novo Usuário'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role selector (only for new users AND only for support role) */}
              {!editingUser && isSupportUser && (
                <div className="col-span-full space-y-2">
                  <Label>Tipo de Usuário</Label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="resident"
                        checked={form.role === 'resident'}
                        onChange={() => setForm({ ...form, role: 'resident' })}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Home className="h-3.5 w-3.5" /> Morador
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="concierge"
                        checked={form.role === 'concierge'}
                        onChange={() => setForm({ ...form, role: 'concierge' })}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" /> Porteiro
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {form.role === 'resident'
                      ? 'Moradores têm acesso ao painel de visitas, convites e interfone.'
                      : 'Porteiros têm acesso ao dashboard de monitoramento, ações rápidas e configurações.'}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="user-name">Nome Completo</Label>
                <Input
                  id="user-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome completo"
                  maxLength={150}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">E-mail</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@email.com"
                  maxLength={255}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-phone">Telefone</Label>
                <Input
                  id="user-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="11999990000"
                  maxLength={20}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">
                  Senha {editingUser && <span className="text-muted-foreground font-normal">(deixe vazio para manter)</span>}
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Senha de acesso'}
                  minLength={6}
                  required={!editingUser}
                  autoComplete="new-password"
                />
              </div>

              {/* Apartment fields — only for residents */}
              {(form.role === 'resident' || editingUser?.role === 'resident') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="user-apt">Apartamento</Label>
                    <Input
                      id="user-apt"
                      value={form.apartment_number}
                      onChange={(e) => setForm({ ...form, apartment_number: e.target.value })}
                      placeholder="101"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-block">Bloco</Label>
                    <Input
                      id="user-block"
                      value={form.block}
                      onChange={(e) => setForm({ ...form, block: e.target.value })}
                      placeholder="A"
                      maxLength={20}
                      required
                    />
                  </div>
                </>
              )}

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
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {filterRole === 'all'
              ? 'Nenhum usuário cadastrado. Clique em "Novo Usuário" para começar.'
              : `Nenhum ${filterRole === 'resident' ? 'morador' : 'porteiro'} cadastrado.`}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">E-mail</th>
                <th className="text-left px-4 py-3 font-medium">Telefone</th>
                <th className="text-left px-4 py-3 font-medium">Perfil</th>
                <th className="text-left px-4 py-3 font-medium">Unidade</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                  <td className="px-4 py-3">
                    {user.role === 'concierge' ? (
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        <Shield className="h-3 w-3 mr-1" />
                        Porteiro
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <Home className="h-3 w-3 mr-1" />
                        Morador
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.role === 'resident'
                      ? `Bl. ${user.block} - Ap. ${user.apartment_number}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {deleteConfirm === user.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user)}
                          >
                            Sim
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
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(user.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
