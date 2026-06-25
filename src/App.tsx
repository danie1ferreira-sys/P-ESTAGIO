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

  useEffect(() => {
    initStorage();
    setUser(getSession());
    setReady(true);
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
