import { useState, useEffect, useMemo } from 'react';
import Logo from '../components/Logo';
import {
  User, Role, Technician, FormConfig, GeneralConfig,
  FormFieldKey, FORM_FIELD_LABELS, DEFAULT_FORM_CONFIG, DEFAULT_GENERAL_CONFIG,
  ALL_PERMISSIONS, PERMISSION_META, DEFAULT_PERMISSIONS, UserPermissions,
  resolvePermissions,
} from '../types';
import {
  getUsers, addUser, updateUser, deleteUser, resetUserPassword, saveUserPermissions,
  getTechnicians, addTechnician, updateTechnician, deleteTechnician,
  getSystems, saveSystems, getOrgans, saveOrgans,
  getCalls, generateId, generateDefaultPassword,
  getFormConfig, saveFormConfig, getGeneralConfig, saveGeneralConfig,
} from '../utils/storage';

interface AdminPanelProps { user: User; onLogout: () => void; }
type Tab = 'users' | 'technicians' | 'config' | 'lists';

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  const perms = useMemo(() => resolvePermissions(user), [user]);

  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [organs, setOrgans] = useState<string[]>([]);
  const [callsCount, setCallsCount] = useState(0);
  const [formConfig, setFormConfig] = useState<FormConfig>(DEFAULT_FORM_CONFIG);
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>(DEFAULT_GENERAL_CONFIG);
  const [toast, setToast] = useState('');

  // User modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userRole, setUserRole] = useState<Role>('intern');
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Permissions modal
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [editPerms, setEditPerms] = useState<Required<UserPermissions>>({ ...DEFAULT_PERMISSIONS.intern });

  // Reset password modal
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetMustChange, setResetMustChange] = useState(true);

  // Technicians
  const [newTechName, setNewTechName] = useState('');
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [editTechName, setEditTechName] = useState('');

  // Options
  const [newSystem, setNewSystem] = useState('');
  const [newOrgan, setNewOrgan] = useState('');

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deleteTechConfirm, setDeleteTechConfirm] = useState<Technician | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [us, techs, sys, org, calls, fc, gc] = await Promise.all([
        getUsers(), getTechnicians(), getSystems(), getOrgans(), getCalls(),
        getFormConfig(), getGeneralConfig(),
      ]);
      setUsers(us); setTechnicians(techs); setSystems(sys); setOrgans(org);
      setCallsCount(calls.length); setFormConfig(fc); setGeneralConfig(gc);
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    }
  };

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 5000); };

  // Wrapper: executa fn e mostra qualquer erro como toast (nunca silencia)
  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      console.error('[AdminPanel] Erro:', err);
      let msg = 'Erro inesperado. Verifique o console (F12).';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        msg = String((err as Record<string, unknown>).message);
      }
      showMsg(`❌ ${msg}`);
    }
  };

  // ── User CRUD ──────────────────────────────────────────────────────────────

  const openAddUser = () => {
    setEditingUser(null); setUserName(''); setUserUsername('');
    setUserRole('intern'); setGeneratedPassword(''); setShowUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u); setUserName(u.name); setUserUsername(u.username);
    setUserRole(u.role); setGeneratedPassword(''); setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userUsername.trim()) { showMsg('Preencha todos os campos.'); return; }
    const uname = userUsername.trim().toLowerCase();
    if (users.some((u) => u.username.toLowerCase() === uname && (!editingUser || u.id !== editingUser.id))) {
      showMsg('Nome de usuário já em uso.'); return;
    }
    await run(async () => {
      if (editingUser) {
        await updateUser({ ...editingUser, name: userName.trim(), username: userUsername.trim(), role: userRole });
        showMsg('Usuário atualizado!');
        setShowUserModal(false);
      } else {
        const pwd = generateDefaultPassword(uname);
        await addUser({ id: generateId(), name: userName.trim(), username: uname, password: pwd, role: userRole, mustChangePassword: true, permissions: {} });
        setGeneratedPassword(pwd);
      }
      await loadData();
    });
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === user.id) { showMsg('Você não pode excluir sua própria conta.'); return; }
    await run(async () => {
      await deleteUser(u.id);
      setDeleteConfirm(null);
      showMsg('Usuário removido.');
      await loadData();
    });
  };

  // ── Permissions modal ──────────────────────────────────────────────────────

  const openPermissions = (u: User) => {
    setPermissionsUser(u);
    setEditPerms({ ...DEFAULT_PERMISSIONS[u.role], ...(u.permissions ?? {}) } as Required<UserPermissions>);
  };

  const handleSavePermissions = async () => {
    if (!permissionsUser) return;
    await run(async () => {
      // Salva apenas as sobreposições (valores que diferem do padrão do cargo)
      const defaults = DEFAULT_PERMISSIONS[permissionsUser.role];
      const overrides: UserPermissions = {};
      ALL_PERMISSIONS.forEach((p) => {
        if (editPerms[p] !== defaults[p]) overrides[p] = editPerms[p];
      });
      await saveUserPermissions(permissionsUser.id, overrides);
      showMsg(`Permissões de ${permissionsUser.name} salvas!`);
      setPermissionsUser(null);
      await loadData();
    });
  };

  const resetPermissionsToDefault = () => {
    if (!permissionsUser) return;
    setEditPerms({ ...DEFAULT_PERMISSIONS[permissionsUser.role] } as Required<UserPermissions>);
  };

  // ── Reset Password modal ───────────────────────────────────────────────────

  const openResetPwd = (u: User) => {
    setResetUser(u); setResetPwd(generateDefaultPassword(u.username)); setResetMustChange(true);
  };

  const handleResetPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !resetPwd.trim()) { showMsg('Informe a nova senha.'); return; }
    await run(async () => {
      await resetUserPassword(resetUser.id, resetPwd.trim(), resetMustChange);
      showMsg(`Senha de ${resetUser.name} redefinida!`);
      setResetUser(null);
      await loadData();
    });
  };

  // ── Technicians CRUD ───────────────────────────────────────────────────────

  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim()) return;
    if (technicians.some((t) => t.name.toLowerCase() === newTechName.trim().toLowerCase())) {
      showMsg('Técnico com este nome já existe.'); return;
    }
    await run(async () => {
      await addTechnician({ id: generateId(), name: newTechName.trim() });
      setNewTechName('');
      showMsg('Técnico adicionado!');
      await loadData();
    });
  };

  const handleSaveTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech || !editTechName.trim()) return;
    await run(async () => {
      await updateTechnician({ ...editingTech, name: editTechName.trim() });
      setEditingTech(null);
      setEditTechName('');
      showMsg('Técnico atualizado!');
      await loadData();
    });
  };

  const handleDeleteTech = async (t: Technician) => {
    await run(async () => {
      await deleteTechnician(t.id);
      setDeleteTechConfirm(null);
      showMsg('Técnico removido.');
      await loadData();
    });
  };

  // ── Form Config ────────────────────────────────────────────────────────────

  const updateFieldConfig = (field: FormFieldKey, key: 'enabled' | 'required', value: boolean) => {
    setFormConfig((prev) => ({ ...prev, [field]: { ...prev[field], [key]: value } }));
  };

  const handleSaveFormConfig = () => run(async () => {
    await saveFormConfig(formConfig);
    showMsg('Configurações do formulário salvas!');
  });

  const handleResetFormConfig = () => { setFormConfig(DEFAULT_FORM_CONFIG); showMsg('Formulário resetado ao padrão.'); };

  // ── General Config ─────────────────────────────────────────────────────────

  const handleSaveGeneralConfig = () => run(async () => {
    await saveGeneralConfig(generalConfig);
    showMsg('Configurações gerais salvas!');
  });

  // ── Options CRUD ───────────────────────────────────────────────────────────

  const handleAddSystem = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newSystem.trim()) return;
    if (systems.some((s) => s.toLowerCase() === newSystem.trim().toLowerCase())) { showMsg('Sistema já existe.'); return; }
    await run(async () => {
      const updated = [...systems, newSystem.trim()];
      await saveSystems(updated); setSystems(updated); setNewSystem(''); showMsg('Sistema adicionado!');
    });
  };

  const handleDeleteSystem = async (s: string) => {
    await run(async () => {
      const updated = systems.filter((x) => x !== s);
      await saveSystems(updated); setSystems(updated); showMsg('Sistema removido.');
    });
  };

  const handleAddOrgan = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newOrgan.trim()) return;
    if (organs.some((o) => o.toLowerCase() === newOrgan.trim().toLowerCase())) { showMsg('Órgão já existe.'); return; }
    await run(async () => {
      const updated = [...organs, newOrgan.trim()];
      await saveOrgans(updated); setOrgans(updated); setNewOrgan(''); showMsg('Órgão/Setor adicionado!');
    });
  };

  const handleDeleteOrgan = async (o: string) => {
    await run(async () => {
      const updated = organs.filter((x) => x !== o);
      await saveOrgans(updated); setOrgans(updated); showMsg('Órgão/Setor removido.');
    });
  };

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    supervisors: users.filter((u) => u.role === 'supervisor').length,
    interns: users.filter((u) => u.role === 'intern').length,
    technicians: technicians.length,
    calls: callsCount,
  }), [users, technicians, callsCount]);

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const availableTabs = [
    { id: 'users'       as Tab, label: 'Usuários',         icon: '👤', show: perms.canManageUsers },
    { id: 'technicians' as Tab, label: 'Técnicos',         icon: '🔧', show: perms.canManageTechnicians },
    { id: 'config'      as Tab, label: 'Configurações',    icon: '⚙️', show: perms.canManageSettings || perms.canViewStats },
    { id: 'lists'       as Tab, label: 'Sistemas & Órgãos',icon: '📋', show: perms.canManageOptions },
  ].filter((t) => t.show);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find((t) => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Logo size={42} />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              <span className="text-xs text-rose-600 font-medium">Administrador</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white font-semibold flex items-center justify-center text-sm shadow-md">
              {user.name.charAt(0)}
            </div>
            <button onClick={onLogout} className="text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition" title="Sair">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-medium mb-2">
            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full" /> Painel de Controle
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Configurações Gerais</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie usuários, técnicos, formulário e configurações do sistema.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-1 overflow-x-auto pb-1">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 h-1.5" />

          {/* ── TAB: USERS ── */}
          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Contas de Usuários</h2>
                  <p className="text-sm text-slate-500">Gerencie logins, senhas, cargos e permissões individuais.</p>
                </div>
                <button onClick={openAddUser} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold hover:from-rose-600 hover:to-rose-700 transition shadow-md shadow-rose-500/20 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Novo Usuário
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-semibold">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold">Login</th>
                      <th className="px-4 py-3 text-left font-semibold">Cargo</th>
                      <th className="px-4 py-3 text-left font-semibold">Flags</th>
                      <th className="px-4 py-3 text-center font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {u.name}
                          {u.id === user.id && <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-500 py-0.5 px-1.5 rounded-full">Você</span>}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 text-xs">{u.username}</td>
                        <td className="px-4 py-3.5"><RoleBadge role={u.role} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {u.mustChangePassword && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 font-medium">🔑 Troca senha</span>
                            )}
                            {Object.keys(u.permissions ?? {}).length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 font-medium">✏️ Perms custom</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-center gap-1">
                            <ActionBtn icon="✏️" title="Editar" color="blue" onClick={() => openEditUser(u)} />
                            <ActionBtn icon="🔐" title="Permissões" color="purple" onClick={() => openPermissions(u)} />
                            <ActionBtn icon="🔑" title="Redefinir senha" color="amber" onClick={() => openResetPwd(u)} />
                            <ActionBtn icon="🗑️" title="Excluir" color="red" onClick={() => setDeleteConfirm(u)} disabled={u.id === user.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: TECHNICIANS ── */}
          {activeTab === 'technicians' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Técnicos de Suporte</h2>
                <p className="text-sm text-slate-500">
                  Técnicos não possuem login. Seus nomes aparecem como opção de auxílio no formulário dos estagiários.
                </p>
              </div>

              <form onSubmit={handleAddTech} className="flex gap-2 max-w-md mb-6">
                <input
                  type="text" value={newTechName} onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="Nome do técnico"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition"
                />
                <button type="submit" className="px-4 py-2.5 bg-slate-800 text-white font-medium hover:bg-slate-900 rounded-xl transition text-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Adicionar
                </button>
              </form>

              {technicians.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="text-4xl mb-2">🔧</div>
                  <p className="text-slate-500 text-sm">Nenhum técnico cadastrado ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {technicians.map((t) => (
                    <div key={t.id} className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 hover:border-amber-200 transition">
                      {editingTech?.id === t.id ? (
                        <form onSubmit={handleSaveTech} className="flex gap-2">
                          <input
                            type="text" value={editTechName} onChange={(e) => setEditTechName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm rounded-lg border border-amber-300 outline-none"
                            autoFocus
                          />
                          <button type="submit" className="text-green-600 hover:text-green-700 p-1">✓</button>
                          <button type="button" onClick={() => setEditingTech(null)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-xs font-bold">
                              {t.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-slate-800">{t.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingTech(t); setEditTechName(t.name); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition text-xs">✏️</button>
                            <button onClick={() => setDeleteTechConfirm(t)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition text-xs">🗑️</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CONFIG ── */}
          {activeTab === 'config' && (
            <div className="p-6 space-y-8">
              {/* Form Config */}
              {perms.canManageSettings && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">📋 Formulário de Chamados</h2>
                      <p className="text-sm text-slate-500">Configure quais campos aparecem no formulário do estagiário.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleResetFormConfig} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                        Resetar padrão
                      </button>
                      <button onClick={handleSaveFormConfig} className="px-4 py-1.5 text-xs rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition">
                        Salvar
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 border-b border-slate-100">
                      <span>Campo</span>
                      <span className="w-20 text-center">Visível</span>
                      <span className="w-24 text-center">Obrigatório</span>
                    </div>
                    {(Object.keys(FORM_FIELD_LABELS) as FormFieldKey[]).map((key) => {
                      const meta = FORM_FIELD_LABELS[key];
                      const cfg = formConfig[key];
                      return (
                        <div key={key} className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-white/60 transition">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base">{meta.icon}</span>
                              <span className="text-sm font-medium text-slate-700">{meta.label}</span>
                              {key === 'callNumber' && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">condicional</span>
                              )}
                            </div>
                            {meta.note && <p className="text-xs text-slate-400 mt-0.5 ml-7">{meta.note}</p>}
                          </div>
                          <div className="w-20 flex justify-center">
                            <Toggle
                              checked={cfg.enabled}
                              onChange={(v) => updateFieldConfig(key, 'enabled', v)}
                              disabled={key === 'callNumber' ? false : false}
                            />
                          </div>
                          <div className="w-24 flex justify-center">
                            <input
                              type="checkbox"
                              checked={cfg.required}
                              onChange={(e) => updateFieldConfig(key, 'required', e.target.checked)}
                              disabled={!cfg.enabled}
                              className="w-4 h-4 accent-rose-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                    Data e Hora são sempre exibidos e obrigatórios.
                  </div>
                </section>
              )}

              {/* General Config */}
              {perms.canManageSettings && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">⚙️ Configurações Gerais</h2>
                      <p className="text-sm text-slate-500">Comportamento geral do sistema para todos os painéis.</p>
                    </div>
                    <button onClick={handleSaveGeneralConfig} className="px-4 py-1.5 text-xs rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition">
                      Salvar
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                    <ConfigRow
                      label="Auto-refresh no painel do supervisor"
                      description="Atualiza automaticamente a lista de chamados"
                    >
                      <Toggle
                        checked={generalConfig.supervisorAutoRefresh}
                        onChange={(v) => setGeneralConfig((p) => ({ ...p, supervisorAutoRefresh: v }))}
                      />
                    </ConfigRow>

                    {generalConfig.supervisorAutoRefresh && (
                      <ConfigRow label="Intervalo de atualização" description="Tempo em segundos entre cada refresh">
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={5} max={300}
                            value={generalConfig.supervisorAutoRefreshInterval}
                            onChange={(e) => setGeneralConfig((p) => ({ ...p, supervisorAutoRefreshInterval: Number(e.target.value) }))}
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-center outline-none focus:border-rose-400"
                          />
                          <span className="text-xs text-slate-500">segundos</span>
                        </div>
                      </ConfigRow>
                    )}

                    <ConfigRow
                      label="Mostrar últimos chamados no painel do estagiário"
                      description="Exibe os 5 chamados mais recentes abaixo do formulário"
                    >
                      <Toggle
                        checked={generalConfig.showRecentCallsInIntern}
                        onChange={(v) => setGeneralConfig((p) => ({ ...p, showRecentCallsInIntern: v }))}
                      />
                    </ConfigRow>
                  </div>
                </section>
              )}

              {/* Stats */}
              {perms.canViewStats && (
                <section>
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">📊 Estatísticas</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatMini label="Usuários" value={stats.total} icon="👥" />
                    <StatMini label="Estagiários" value={stats.interns} icon="👨‍💻" />
                    <StatMini label="Supervisores" value={stats.supervisors} icon="👩‍💼" />
                    <StatMini label="Admins" value={stats.admins} icon="🛡️" />
                    <StatMini label="Técnicos" value={stats.technicians} icon="🔧" />
                    <StatMini label="Chamados" value={stats.calls} icon="📝" />
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ── TAB: LISTS ── */}
          {activeTab === 'lists' && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Systems */}
              <section>
                <h2 className="text-base font-semibold text-slate-800 mb-1">💻 Sistemas</h2>
                <p className="text-sm text-slate-500 mb-4">Opções de sistema no formulário de chamados.</p>
                <form onSubmit={handleAddSystem} className="flex gap-2 mb-4">
                  <input type="text" value={newSystem} onChange={(e) => setNewSystem(e.target.value)} placeholder="Novo sistema..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition" />
                  <button type="submit" className="px-3 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition text-sm font-medium">+ Adicionar</button>
                </form>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {systems.map((s) => (
                    <div key={s} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 hover:border-slate-200 transition">
                      <span className="text-sm text-slate-700">{s}</span>
                      <button onClick={() => handleDeleteSystem(s)} className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-white transition text-xs">🗑️</button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Organs */}
              <section>
                <h2 className="text-base font-semibold text-slate-800 mb-1">🏢 Órgãos / Setores</h2>
                <p className="text-sm text-slate-500 mb-4">Órgãos e setores públicos atendidos pelo suporte.</p>
                <form onSubmit={handleAddOrgan} className="flex gap-2 mb-4">
                  <input type="text" value={newOrgan} onChange={(e) => setNewOrgan(e.target.value)} placeholder="Novo órgão/setor..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition" />
                  <button type="submit" className="px-3 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition text-sm font-medium">+ Adicionar</button>
                </form>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {organs.map((o) => (
                    <div key={o} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 hover:border-slate-200 transition">
                      <span className="text-sm text-slate-700">{o}</span>
                      <button onClick={() => handleDeleteOrgan(o)} className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-white transition text-xs">🗑️</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: ADD / EDIT USER ── */}
      {showUserModal && (
        <Modal title={editingUser ? 'Editar Usuário' : 'Novo Usuário'} onClose={() => { setShowUserModal(false); setGeneratedPassword(''); }}>
          <form onSubmit={handleSaveUser} className="space-y-4">
            <FormField label="Nome Completo">
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nome do usuário" required
                className="modal-input" />
            </FormField>
            <FormField label="Login (usuário)">
              <input type="text" value={userUsername} onChange={(e) => setUserUsername(e.target.value)} placeholder="Ex: joaosilva" required
                className="modal-input font-mono" disabled={!!editingUser} />
            </FormField>
            {!editingUser && !generatedPassword && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                <span className="mt-0.5">ℹ️</span>
                Senha inicial gerada automaticamente: <strong>gpi@login{new Date().getFullYear()}</strong>. Usuário troca no primeiro acesso.
              </div>
            )}
            {generatedPassword && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-emerald-700 mb-1">✅ Usuário criado! Anote a senha inicial:</div>
                <div className="font-mono text-base font-bold text-emerald-800 bg-white rounded-lg px-3 py-2 border border-emerald-200 select-all">{generatedPassword}</div>
                <p className="text-xs text-emerald-600 mt-1.5">O usuário precisará criar uma nova senha no primeiro acesso.</p>
                <button type="button" onClick={() => { setShowUserModal(false); setGeneratedPassword(''); }}
                  className="mt-3 w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">
                  Concluir
                </button>
              </div>
            )}
            {!generatedPassword && (
              <>
                <FormField label="Cargo / Permissão">
                  <select value={userRole} onChange={(e) => setUserRole(e.target.value as Role)} className="modal-input">
                    <option value="intern">Estagiário — Registra chamados</option>
                    <option value="supervisor">Supervisor — Visualiza e exporta</option>
                    <option value="admin">Administrador — Acesso ao painel de controle</option>
                  </select>
                </FormField>
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold hover:from-rose-600 hover:to-rose-700 transition text-sm">Salvar</button>
                  <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm">Cancelar</button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}

      {/* ── MODAL: PERMISSIONS ── */}
      {permissionsUser && (
        <Modal title={`Permissões — ${permissionsUser.name}`} onClose={() => setPermissionsUser(null)} wide>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                {permissionsUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{permissionsUser.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleBadge role={permissionsUser.role} />
                  <span className="text-xs text-slate-400">— padrões do cargo marcados em cinza</span>
                </div>
              </div>
              <button onClick={resetPermissionsToDefault} className="ml-auto text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 px-2.5 py-1 rounded-lg transition">
                Resetar padrão
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((perm) => {
                const meta = PERMISSION_META[perm];
                const roleDefault = DEFAULT_PERMISSIONS[permissionsUser.role][perm];
                const current = editPerms[perm] ?? roleDefault;
                const isOverridden = (permissionsUser.permissions ?? {})[perm] !== undefined;
                return (
                  <label key={perm} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    current ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-100'
                  } hover:border-purple-200`}>
                    <input
                      type="checkbox"
                      checked={current}
                      onChange={(e) => setEditPerms((prev) => ({ ...prev, [perm]: e.target.checked }))}
                      className="w-4 h-4 accent-purple-600 mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{meta.icon}</span>
                        <span className="text-sm font-medium text-slate-800">{meta.label}</span>
                        {isOverridden && <span className="text-[10px] bg-purple-100 text-purple-600 px-1 py-0.5 rounded">custom</span>}
                        {!isOverridden && <span className="text-[10px] text-slate-400">(padrão)</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleSavePermissions} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition text-sm">
                Salvar Permissões
              </button>
              <button onClick={() => setPermissionsUser(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: RESET PASSWORD ── */}
      {resetUser && (
        <Modal title={`Redefinir Senha — ${resetUser.name}`} onClose={() => setResetUser(null)}>
          <form onSubmit={handleResetPwd} className="space-y-4">
            <FormField label="Nova Senha">
              <div className="flex gap-2">
                <input type="text" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} placeholder="Nova senha" required
                  className="flex-1 modal-input font-mono" />
                <button type="button" onClick={() => setResetPwd(generateDefaultPassword(resetUser.username))}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition">
                  Gerar
                </button>
              </div>
            </FormField>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <input type="checkbox" checked={resetMustChange} onChange={(e) => setResetMustChange(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-700">Obrigar troca de senha no próximo login</div>
                <div className="text-xs text-slate-500">O usuário será solicitado a criar uma nova senha</div>
              </div>
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-600 hover:to-amber-700 transition text-sm">Redefinir</button>
              <button type="button" onClick={() => setResetUser(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: DELETE USER ── */}
      {deleteConfirm && (
        <Modal title="Confirmar Exclusão" onClose={() => setDeleteConfirm(null)}>
          <div className="text-center py-2">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center text-2xl">⚠️</div>
            <p className="text-slate-600 text-sm mb-6">Remover <strong>{deleteConfirm.name}</strong>? Essa ação é permanente.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteUser(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">Excluir</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: DELETE TECH ── */}
      {deleteTechConfirm && (
        <Modal title="Remover Técnico" onClose={() => setDeleteTechConfirm(null)}>
          <div className="text-center py-2">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center text-2xl">🔧</div>
            <p className="text-slate-600 text-sm mb-6">Remover o técnico <strong>{deleteTechConfirm.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteTech(deleteTechConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">Remover</button>
              <button onClick={() => setDeleteTechConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-[slideUp_0.3s_ease-out] max-w-sm text-center">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className={`bg-white rounded-3xl shadow-2xl w-full overflow-hidden animate-[slideUp_0.3s_ease-out] ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-bold text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex w-10 h-5.5 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-rose-500' : 'bg-slate-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block w-4 h-4 transform bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

function ConfigRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
      <div className="ml-4 flex-shrink-0">{children}</div>
    </div>
  );
}

function ActionBtn({ icon, title, color, onClick, disabled }: {
  icon: string; title: string; color: string; onClick: () => void; disabled?: boolean;
}) {
  const colors: Record<string, string> = {
    blue:   'text-blue-600 hover:bg-blue-50',
    purple: 'text-purple-600 hover:bg-purple-50',
    amber:  'text-amber-600 hover:bg-amber-50',
    red:    'text-red-500 hover:bg-red-50',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition text-sm ${colors[color]} disabled:opacity-30 disabled:pointer-events-none`}
    >
      {icon}
    </button>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const map = {
    admin:      { style: 'bg-rose-50 text-rose-700 border-rose-100',    label: 'Admin' },
    supervisor: { style: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'Supervisor' },
    intern:     { style: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Estagiário' },
  };
  const { style, label } = map[role];
  return <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${style}`}>{label}</span>;
}

function StatMini({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  );
}
