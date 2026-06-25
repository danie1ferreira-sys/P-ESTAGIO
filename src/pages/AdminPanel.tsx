import { useState, useEffect, useMemo } from 'react';
import Logo from '../components/Logo';
import { User, Role } from '../types';
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getSystems,
  saveSystems,
  getOrgans,
  saveOrgans,
  getCalls,
  generateId,
} from '../utils/storage';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'users' | 'systems' | 'organs' | 'stats';

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [organs, setOrgans] = useState<string[]>([]);
  const [callsCount, setCallsCount] = useState(0);
  const [toast, setToast] = useState('');

  // Modals & Forms State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<Role>('intern');

  const [newSystem, setNewSystem] = useState('');
  const [newOrgan, setNewOrgan] = useState('');

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(getUsers());
    setSystems(getSystems());
    setOrgans(getOrgans());
    setCallsCount(getCalls().length);
  };

  const showMessage = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // User Actions
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserUsername('');
    setUserPassword('');
    setUserRole('intern');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserUsername(u.username);
    setUserPassword(u.password);
    setUserRole(u.role);
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userUsername.trim() || !userPassword.trim()) {
      showMessage('Preencha todos os campos do usuário.');
      return;
    }

    const usernameLower = userUsername.trim().toLowerCase();
    const isDuplicate = users.some(
      (u) => u.username.toLowerCase() === usernameLower && (!editingUser || u.id !== editingUser.id)
    );

    if (isDuplicate) {
      showMessage('Este nome de usuário já está em uso.');
      return;
    }

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        name: userName.trim(),
        username: userUsername.trim(),
        password: userPassword.trim(),
        role: userRole,
      };
      updateUser(updated);
      showMessage('Usuário atualizado com sucesso!');
    } else {
      const newUser: User = {
        id: generateId(),
        name: userName.trim(),
        username: userUsername.trim(),
        password: userPassword.trim(),
        role: userRole,
      };
      addUser(newUser);
      showMessage('Usuário cadastrado com sucesso!');
    }

    setShowUserModal(false);
    loadData();
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === user.id) {
      showMessage('Você não pode excluir a sua própria conta de administrador.');
      return;
    }
    deleteUser(u.id);
    setDeleteConfirmUser(null);
    showMessage('Usuário removido com sucesso.');
    loadData();
  };

  // Systems Configuration
  const handleAddSystem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSystem.trim()) return;
    if (systems.some((s) => s.toLowerCase() === newSystem.trim().toLowerCase())) {
      showMessage('Este sistema já existe.');
      return;
    }
    const updated = [...systems, newSystem.trim()];
    saveSystems(updated);
    setSystems(updated);
    setNewSystem('');
    showMessage('Sistema adicionado com sucesso!');
  };

  const handleDeleteSystem = (sys: string) => {
    const updated = systems.filter((s) => s !== sys);
    saveSystems(updated);
    setSystems(updated);
    showMessage('Sistema removido.');
  };

  // Organs Configuration
  const handleAddOrgan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgan.trim()) return;
    if (organs.some((o) => o.toLowerCase() === newOrgan.trim().toLowerCase())) {
      showMessage('Este órgão/setor já existe.');
      return;
    }
    const updated = [...organs, newOrgan.trim()];
    saveOrgans(updated);
    setOrgans(updated);
    setNewOrgan('');
    showMessage('Órgão/Setor adicionado com sucesso!');
  };

  const handleDeleteOrgan = (org: string) => {
    const updated = organs.filter((o) => o !== org);
    saveOrgans(updated);
    setOrgans(updated);
    showMessage('Órgão/Setor removido.');
  };

  // Stats Breakdown
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const supervisors = users.filter((u) => u.role === 'supervisor').length;
    const interns = users.filter((u) => u.role === 'intern').length;

    return { totalUsers, admins, supervisors, interns };
  }, [users]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      {/* Header */}
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
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-medium mb-2">
              <span className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
              Painel de Controle do Admin
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Configurações Gerais</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie logins, senhas, cargos e estruture a página de chamados.</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto pb-1">
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          } label="Gerenciar Usuários" />
          
          <TabButton active={activeTab === 'systems'} onClick={() => setActiveTab('systems')} icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 00-2 2z" />
            </svg>
          } label="Sistemas" />

          <TabButton active={activeTab === 'organs'} onClick={() => setActiveTab('organs')} icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          } label="Órgãos / Setores" />

          <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm9-8v10a2 2 0 01-2 2h-2a2 2 0 01-2-2V11a2 2 0 012-2h2a2 2 0 012 2z" />
            </svg>
          } label="Estatísticas" />
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 h-1.5" />

          {/* TAB 1: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Contas de Usuários</h2>
                  <p className="text-sm text-slate-500">Cadastre e altere logins, senhas e permissões de acesso.</p>
                </div>
                <button
                  onClick={handleOpenAddUser}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold hover:from-rose-600 hover:to-rose-700 transition shadow-md shadow-rose-500/20 text-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Adicionar Usuário
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold">Nome</th>
                      <th className="px-6 py-3 text-left font-semibold">Usuário (Login)</th>
                      <th className="px-6 py-3 text-left font-semibold">Senha</th>
                      <th className="px-6 py-3 text-left font-semibold">Cargo / Função</th>
                      <th className="px-6 py-3 text-center font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-medium text-slate-800">{u.name} {u.id === user.id && <span className="text-[10px] bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full ml-1">Você</span>}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{u.username}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono">{u.password}</td>
                        <td className="px-6 py-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                              title="Editar usuário"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              disabled={u.id === user.id}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Excluir usuário"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEMS CONFIG */}
          {activeTab === 'systems' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Configurar Sistemas</h2>
              <p className="text-sm text-slate-500 mb-6">Defina as opções de sistemas que aparecem no formulário de chamados.</p>

              <form onSubmit={handleAddSystem} className="flex gap-2 max-w-md mb-6">
                <input
                  type="text"
                  value={newSystem}
                  onChange={(e) => setNewSystem(e.target.value)}
                  placeholder="Nome do novo sistema (Ex: Patrimônio)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 text-white font-medium hover:bg-slate-900 rounded-xl transition text-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {systems.map((s) => (
                  <div
                    key={s}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between hover:border-slate-200 hover:bg-slate-100/30 transition"
                  >
                    <span className="text-slate-700 font-medium text-sm">{s}</span>
                    <button
                      onClick={() => handleDeleteSystem(s)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white transition"
                      title="Excluir sistema"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ORGANS CONFIG */}
          {activeTab === 'organs' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Configurar Órgãos / Setores</h2>
              <p className="text-sm text-slate-500 mb-6">Defina as opções de órgãos ou setores públicos atendidos pelo suporte.</p>

              <form onSubmit={handleAddOrgan} className="flex gap-2 max-w-md mb-6">
                <input
                  type="text"
                  value={newOrgan}
                  onChange={(e) => setNewOrgan(e.target.value)}
                  placeholder="Nome do órgão/setor (Ex: Secretaria de Saúde)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 text-white font-medium hover:bg-slate-900 rounded-xl transition text-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {organs.map((o) => (
                  <div
                    key={o}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between hover:border-slate-200 hover:bg-slate-100/30 transition"
                  >
                    <span className="text-slate-700 font-medium text-sm">{o}</span>
                    <button
                      onClick={() => handleDeleteOrgan(o)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white transition"
                      title="Excluir órgão/setor"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STATS */}
          {activeTab === 'stats' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Métricas Gerais</h2>
              <p className="text-sm text-slate-500 mb-6">Métricas de controle do sistema.</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCardMini label="Total de Usuários" value={stats.totalUsers} icon="👥" />
                <StatCardMini label="Total de Estagiários" value={stats.interns} icon="👨‍💻" />
                <StatCardMini label="Supervisores" value={stats.supervisors} icon="👩‍💼" />
                <StatCardMini label="Chamados Registrados" value={callsCount} icon="📝" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Sistemas Cadastrados ({systems.length})
                  </h3>
                  <div className="text-sm text-slate-600 max-h-60 overflow-y-auto space-y-1">
                    {systems.map((s, i) => (
                      <div key={s} className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 flex justify-between">
                        <span>{s}</span>
                        <span className="text-slate-400 font-mono text-xs">#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Órgãos Atendidos ({organs.length})
                  </h3>
                  <div className="text-sm text-slate-600 max-h-60 overflow-y-auto space-y-1">
                    {organs.map((o, i) => (
                      <div key={o} className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 flex justify-between">
                        <span>{o}</span>
                        <span className="text-slate-400 font-mono text-xs">#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* USER FORM MODAL (ADD / EDIT) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Usuário (Login)</label>
                <input
                  type="text"
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value)}
                  placeholder="Ex: joaosilva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha de Acesso</label>
                <input
                  type="text"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Senha forte"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Permissão</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-sm transition"
                >
                  <option value="intern">Estagiário (Registra chamados)</option>
                  <option value="supervisor">Supervisor (Gera planilhas e visualiza)</option>
                  <option value="admin">Administrador (Acesso total)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold hover:from-rose-600 hover:to-rose-700 transition shadow-md shadow-rose-500/30 text-sm"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-[slideUp_0.3s_ease-out]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-sm mb-6">
              Tem certeza que deseja remover o usuário <strong>{deleteConfirmUser.name}</strong>? Essa ação é permanente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Excluir
              </button>
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-[slideUp_0.3s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 ${
        active
          ? 'border-rose-600 text-rose-600'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const styles = {
    admin: 'bg-rose-50 text-rose-700 border-rose-100',
    supervisor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    intern: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  const labels = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    intern: 'Estagiário',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold ${styles[role]}`}>
      {labels[role]}
    </span>
  );
}

function StatCardMini({ label, value, icon }: { label: string; value: number; icon: string }) {
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
