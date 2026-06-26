import { useEffect, useState } from 'react';
import Login from './pages/Login';
import InternPanel from './pages/InternPanel';
import SupervisorPanel from './pages/SupervisorPanel';
import AdminPanel from './pages/AdminPanel';
import { User } from './types';
import { initStorage, getSession, clearSession } from './utils/storage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initStorage()
      .then(() => {
        setUser(getSession());
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Não foi possível conectar ao Supabase.');
      })
      .finally(() => setReady(true));
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl bg-white border border-red-100 shadow-xl p-6">
          <h1 className="text-lg font-semibold text-slate-800 mb-2">Conexão não configurada</h1>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === 'admin') {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'supervisor') {
    return <SupervisorPanel user={user} onLogout={handleLogout} />;
  }

  return <InternPanel user={user} onLogout={handleLogout} />;
}
