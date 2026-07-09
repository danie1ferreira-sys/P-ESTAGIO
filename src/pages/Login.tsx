import { useState } from 'react';
import Logo from '../components/Logo';
import { authenticate, setSession, updateUser } from '../utils/storage';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // First-access / forced password change
  const [mustChangeUser, setMustChangeUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await authenticate(username, password);
      if (user) {
        if (user.mustChangePassword) {
          // Redirect to forced password change screen
          setMustChangeUser(user);
        } else {
          setSession(user);
          onLogin(user);
        }
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao conectar com o Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');

    if (!newPassword.trim()) {
      setChangeError('Informe a nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      setChangeError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('As senhas não coincidem.');
      return;
    }
    if (!mustChangeUser) return;

    setChangingPassword(true);
    try {
      const updated: User = {
        ...mustChangeUser,
        password: newPassword.trim(),
        mustChangePassword: false,
      };
      await updateUser(updated);
      setSession(updated);
      onLogin(updated);
    } catch (err) {
      setChangeError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setChangingPassword(false);
    }
  };

  // ─── Force Password Change Screen ──────────────────────────────────────────
  if (mustChangeUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-orange-400/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-yellow-300/20 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-amber-500/20 mb-4">
              <Logo size={72} showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Primeiro Acesso</h1>
            <p className="text-slate-500 text-sm text-center">
              Por segurança, você deve criar uma nova senha antes de continuar.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-amber-900/10 border border-white p-8">
            {/* User info */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-sm">
                {mustChangeUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{mustChangeUser.name}</div>
                <div className="text-xs text-amber-700">Alteração de senha obrigatória</div>
              </div>
              <svg className="w-5 h-5 text-amber-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nova Senha</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition text-sm"
                    placeholder="Mínimo 6 caracteres"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar Nova Senha</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition text-sm"
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>

              {changeError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {changeError}
                </div>
              )}

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-600/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar Nova Senha e Entrar
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © {new Date().getFullYear()} GPI Sistemas — Todos os direitos reservados
          </p>
        </div>
      </div>
    );
  }

  // ─── Normal Login Screen ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-blue-700/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-sky-300/30 blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d47a1" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo section */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-4 rounded-3xl shadow-xl shadow-blue-500/20 mb-4">
            <Logo size={72} showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">GPI Sistemas</h1>
          <p className="text-slate-500 text-sm">Sistema de Registro de Chamados</p>
        </div>

        {/* Login card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Acesse sua conta</h2>
          <p className="text-slate-500 text-sm mb-6">Entre com suas credenciais para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Usuário</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-sm"
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-sm"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>Entrar</>
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-100 p-4">
          <div className="flex items-start gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-xs text-slate-600 font-medium">Credenciais de demonstração</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
            <div className="bg-white rounded-lg p-1.5 border border-slate-100">
              <div className="font-semibold text-rose-700">Admin</div>
              <div className="text-slate-500">admin / admin123</div>
            </div>
            <div className="bg-white rounded-lg p-1.5 border border-slate-100">
              <div className="font-semibold text-blue-700">Supervisora</div>
              <div className="text-slate-500">supervisora / gpi123</div>
            </div>
            <div className="bg-white rounded-lg p-1.5 border border-slate-100">
              <div className="font-semibold text-emerald-700">Estagiário</div>
              <div className="text-slate-500">joao / estagio123</div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} GPI Sistemas — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
