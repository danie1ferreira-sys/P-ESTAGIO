import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Logo from '../components/Logo';
import { User, CallRecord } from '../types';
import { getCalls, getInterns, getSystems, getOrgans } from '../utils/storage';

interface SupervisorPanelProps {
  user: User;
  onLogout: () => void;
}

export default function SupervisorPanel({ user, onLogout }: SupervisorPanelProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [internFilter, setInternFilter] = useState('');
  const [organFilter, setOrganFilter] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [callNumberFilter, setCallNumberFilter] = useState('');
  const [toast, setToast] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [systems, setSystems] = useState<string[]>([]);
  const [organs, setOrgans] = useState<string[]>([]);
  const [interns, setInterns] = useState<User[]>([]);

  const loadData = async () => {
    const [allCalls, sys, org, allInterns] = await Promise.all([
      getCalls(),
      getSystems(),
      getOrgans(),
      getInterns(),
    ]);
    setCalls(allCalls);
    setSystems(sys);
    setOrgans(org);
    setInterns(allInterns);
  };

  const refreshCalls = async () => {
    const allCalls = await getCalls();
    setCalls(allCalls);
  };

  useEffect(() => {
    loadData().then(async () => {
      // Use dynamic auto-refresh config from admin settings
      const gc = await import('../utils/storage').then((m) => m.getGeneralConfig());
      if (gc.supervisorAutoRefresh) {
        const interval = setInterval(() => { void refreshCalls(); }, gc.supervisorAutoRefreshInterval * 1000);
        return () => clearInterval(interval);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    return calls.filter((c) => {
      if (dateFilter && c.date !== dateFilter) return false;
      if (internFilter && c.internId !== internFilter) return false;
      if (organFilter && c.organ !== organFilter) return false;
      if (systemFilter && c.system !== systemFilter) return false;
      if (callNumberFilter && !c.callNumber.toLowerCase().includes(callNumberFilter.toLowerCase())) return false;
      return true;
    });
  }, [calls, dateFilter, internFilter, organFilter, systemFilter, callNumberFilter]);

  const clearFilters = () => {
    setDateFilter('');
    setInternFilter('');
    setOrganFilter('');
    setSystemFilter('');
    setCallNumberFilter('');
  };

  const exportExcel = () => {
    if (filtered.length === 0) {
      setToast('Nenhum registro encontrado para exportar.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    const data = filtered.map((c) => ({
      Data: c.date,
      Hora: c.time,
      Estagiário: c.internName,
      'Número do Chamado': c.callNumber,
      'Órgão / Setor': c.organ,
      'Sistema Atendido': c.system,
      'Descrição do Atendimento': c.description,
      'Solução Aplicada': c.solution,
      'Recebeu ajuda?': c.receivedHelp === 'sim' ? 'Sim' : 'Não',
      'Nome do colega/técnico': c.helperName || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 18 }, { wch: 25 },
      { wch: 22 }, { wch: 50 }, { wch: 50 }, { wch: 15 }, { wch: 25 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chamados');
    const filename = `chamados-gpi-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    setToast(`Planilha gerada: ${filename}`);
    setTimeout(() => setToast(''), 3500);
  };

  const hasActiveFilters = dateFilter || internFilter || organFilter || systemFilter || callNumberFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Logo size={42} />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              <span className="text-xs text-blue-600">Supervisora</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 text-white font-semibold flex items-center justify-center text-sm shadow-md">
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
        {/* Title & Stats */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            Painel Administrativo
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Chamados Registrados</h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhe todos os atendimentos registrados pelos estagiários.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total de Chamados" value={calls.length} color="blue" />
          <StatCard label="Com ajuda" value={calls.filter((c) => c.receivedHelp === 'sim').length} color="sky" />
          <StatCard label="Estagiários ativos" value={new Set(calls.map((c) => c.internId)).size} color="indigo" />
          <StatCard label="Filtrados" value={filtered.length} color="slate" />
        </div>

        {/* Filters & Export */}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-1.5" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtros
              </h2>
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:from-green-700 hover:to-green-800 transition shadow-lg shadow-green-500/20 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Gerar Planilha Excel
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <SmallField label="Data">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="filter-input"
                />
              </SmallField>
              <SmallField label="Estagiário">
                <select
                  value={internFilter}
                  onChange={(e) => setInternFilter(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Todos</option>
                  {interns.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </SmallField>
              <SmallField label="Órgão">
                <select
                  value={organFilter}
                  onChange={(e) => setOrganFilter(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Todos</option>
                  {organs.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </SmallField>
              <SmallField label="Sistema">
                <select
                  value={systemFilter}
                  onChange={(e) => setSystemFilter(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Todos</option>
                  {systems.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </SmallField>
              <SmallField label="Nº Chamado">
                <input
                  type="text"
                  value={callNumberFilter}
                  onChange={(e) => setCallNumberFilter(e.target.value)}
                  placeholder="Buscar..."
                  className="filter-input"
                />
              </SmallField>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Registros</h2>
            <span className="text-sm text-slate-500">{filtered.length} resultados</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 pb-12 pt-6 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">Nenhum chamado encontrado.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold">Nº</th>
                      <th className="px-6 py-3 text-left font-semibold">Data/Hora</th>
                      <th className="px-6 py-3 text-left font-semibold">Estagiário</th>
                      <th className="px-6 py-3 text-left font-semibold">Órgão</th>
                      <th className="px-6 py-3 text-left font-semibold">Sistema</th>
                      <th className="px-6 py-3 text-left font-semibold">Ajuda</th>
                      <th className="px-6 py-3 text-center font-semibold">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50/30 transition">
                        <td className="px-6 py-3.5 font-semibold text-slate-800">#{c.callNumber}</td>
                        <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">
                          <div>{c.date}</div>
                          <div className="text-xs text-slate-400">{c.time}</div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">{c.internName}</td>
                        <td className="px-6 py-3.5 text-slate-600">{c.organ}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                            {c.system}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          {c.receivedHelp === 'sim' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium" title={c.helperName}>
                              Sim • {c.helperName}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1"
                          >
                            {expandedId === c.id ? 'Fechar' : 'Ver'}
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d={expandedId === c.id ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-slate-100">
                {filtered.map((c) => (
                  <div key={c.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-semibold text-slate-800">#{c.callNumber}</div>
                        <div className="text-xs text-slate-500">{c.date} {c.time}</div>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        {c.system}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 mb-1">{c.internName}</div>
                    <div className="text-xs text-slate-500">{c.organ}</div>
                    <button
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="mt-2 text-blue-600 text-xs font-medium"
                    >
                      {expandedId === c.id ? 'Fechar detalhes ▲' : 'Ver detalhes ▼'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Expanded details */}
              {expandedId && (() => {
                const c = filtered.find((r) => r.id === expandedId);
                if (!c) return null;
                return (
                  <div className="border-t border-slate-200 bg-blue-50/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-800">Detalhes do Chamado #{c.callNumber}</h3>
                      <button
                        onClick={() => setExpandedId(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DetailItem label="Estagiário" value={c.internName} />
                      <DetailItem label="Data e Hora" value={`${c.date} ${c.time}`} />
                      <DetailItem label="Órgão" value={c.organ} />
                      <DetailItem label="Sistema" value={c.system} />
                      <DetailItem label="Recebeu ajuda?" value={c.receivedHelp === 'sim' ? `Sim - ${c.helperName}` : 'Não'} />
                      <DetailItem label="Número" value={c.callNumber} />
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descrição</div>
                        <div className="bg-white rounded-xl p-4 text-sm text-slate-700 border border-slate-100">{c.description}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Solução</div>
                        <div className="bg-white rounded-xl p-4 text-sm text-slate-700 border border-slate-100">{c.solution}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} GPI Sistemas — Sistema de Registro de Chamados
        </p>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-[slideUp_0.3s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'sky' | 'indigo' | 'slate' }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-700 text-blue-700 bg-blue-50',
    sky: 'from-sky-500 to-sky-700 text-sky-700 bg-sky-50',
    indigo: 'from-indigo-500 to-indigo-700 text-indigo-700 bg-indigo-50',
    slate: 'from-slate-500 to-slate-700 text-slate-700 bg-slate-50',
  };
  const [, , textColor, bgColor] = colorMap[color].split(' ');
  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
          <svg className={`w-4.5 h-4.5 ${textColor}`} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4M5 12h14M12 5v14" />
          </svg>
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-800 leading-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-slate-100">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}
