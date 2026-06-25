import { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import { User, CallRecord } from '../types';
import { addCall, getCallsByIntern, getInterns, generateId, getSystems, getOrgans } from '../utils/storage';

interface InternPanelProps {
  user: User;
  onLogout: () => void;
}

interface FormState {
  date: string;
  time: string;
  callNumber: string;
  organ: string;
  system: string;
  description: string;
  solution: string;
  receivedHelp: 'sim' | 'nao' | '';
  helperName: string;
}

const emptyForm = (): FormState => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  return {
    date: dateStr,
    time: timeStr,
    callNumber: '',
    organ: '',
    system: '',
    description: '',
    solution: '',
    receivedHelp: '',
    helperName: '',
  };
};

export default function InternPanel({ user, onLogout }: InternPanelProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [myCalls, setMyCalls] = useState<CallRecord[]>([]);
  const [toast, setToast] = useState('');
  const [systems, setSystems] = useState<string[]>([]);
  const [organs, setOrgans] = useState<string[]>([]);
  const helpers = getInterns().filter((u) => u.id !== user.id);

  useEffect(() => {
    setMyCalls(getCallsByIntern(user.id));
    setSystems(getSystems());
    setOrgans(getOrgans());
  }, [user.id]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.date || !form.time || !form.callNumber || !form.organ || !form.system || !form.description || !form.solution) {
      return 'Preencha todos os campos obrigatórios.';
    }
    if (form.receivedHelp !== 'sim' && form.receivedHelp !== 'nao') {
      return 'Informe se recebeu ajuda de algum colega.';
    }
    if (form.receivedHelp === 'sim' && !form.helperName) {
      return 'Selecione quem auxiliou no atendimento.';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setToast(error);
      setTimeout(() => setToast(''), 3000);
      return;
    }
    const newCall: CallRecord = {
      id: generateId(),
      date: form.date,
      time: form.time,
      callNumber: form.callNumber,
      organ: form.organ,
      system: form.system,
      description: form.description,
      solution: form.solution,
      receivedHelp: form.receivedHelp as 'sim' | 'nao',
      helperName: form.receivedHelp === 'sim' ? form.helperName : undefined,
      internId: user.id,
      internName: user.name,
      createdAt: new Date().toISOString(),
    };
    addCall(newCall);
    setMyCalls(getCallsByIntern(user.id));
    setShowModal(true);
  };

  const handleNew = () => {
    setForm(emptyForm());
    setShowModal(false);
    setToast('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = () => {
    setForm(emptyForm());
    setShowModal(false);
    setToast('Chamado registrado com sucesso!');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Logo size={42} />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              <span className="text-xs text-blue-600">Estagiário</span>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            Novo atendimento
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Registrar Chamado</h1>
          <p className="text-slate-500 text-sm mt-1">Preencha os campos abaixo para registrar um novo atendimento.</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-1.5" />
          <div className="p-6 sm:p-8 space-y-6">
            {/* Row 1: Data, Hora, Número */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Data" required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field label="Hora" required>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => update('time', e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field label="Número do Chamado" required>
                <input
                  type="text"
                  value={form.callNumber}
                  onChange={(e) => update('callNumber', e.target.value)}
                  placeholder="Ex.: 1234"
                  className="form-input"
                />
              </Field>
            </div>

            {/* Row 2: Orgão, Sistema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Órgão / Setor" required>
                <select
                  value={form.organ}
                  onChange={(e) => update('organ', e.target.value)}
                  className="form-input"
                >
                  <option value="">Selecione...</option>
                  {organs.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Sistema Atendido" required>
                <select
                  value={form.system}
                  onChange={(e) => update('system', e.target.value)}
                  className="form-input"
                >
                  <option value="">Selecione...</option>
                  {systems.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Row 3: Descrição e Solução */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Descrição do Atendimento" required>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Descreva o problema reportado..."
                  rows={4}
                  className="form-input resize-none"
                />
              </Field>
              <Field label="Solução Aplicada" required>
                <textarea
                  value={form.solution}
                  onChange={(e) => update('solution', e.target.value)}
                  placeholder="Descreva a solução aplicada..."
                  rows={4}
                  className="form-input resize-none"
                />
              </Field>
            </div>

            {/* Help section */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <Field label="Recebeu ajuda de algum colega ou técnico?" required>
                <div className="flex gap-3 mt-2">
                  <label className={`flex-1 cursor-pointer`}>
                    <input
                      type="radio"
                      name="help"
                      checked={form.receivedHelp === 'sim'}
                      onChange={() => update('receivedHelp', 'sim')}
                      className="sr-only peer"
                    />
                    <div className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium text-center peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 transition">
                      Sim
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="help"
                      checked={form.receivedHelp === 'nao'}
                      onChange={() => update('receivedHelp', 'nao')}
                      className="sr-only peer"
                    />
                    <div className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium text-center peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 transition">
                      Não
                    </div>
                  </label>
                </div>
              </Field>

              {form.receivedHelp === 'sim' && (
                <div className="mt-4 animate-[fadeIn_0.3s_ease-out]">
                  <Field label="Selecione quem auxiliou:" required>
                    <select
                      value={form.helperName}
                      onChange={(e) => update('helperName', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Selecione um colega/técnico...</option>
                      {helpers.map((h) => (
                        <option key={h.id} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Salvar Chamado
              </button>
              <button
                type="button"
                onClick={handleNew}
                className="sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Limpar
              </button>
            </div>
          </div>
        </form>

        {/* My recent calls */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Meus últimos chamados</h2>
            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
              {myCalls.length} registros
            </span>
          </div>

          {myCalls.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">Nenhum chamado registrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myCalls.slice(0, 5).map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-3 hover:border-blue-200 hover:shadow-sm transition">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                    #{c.callNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-slate-800">{c.system}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{c.organ}</span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">{c.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{c.date}</span>
                      <span>{c.time}</span>
                      {c.receivedHelp === 'sim' && (
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          Ajuda: {c.helperName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Success modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-[slideUp_0.3s_ease-out]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chamado registrado com sucesso!</h3>
            <p className="text-slate-500 text-sm mb-6">Deseja cadastrar outro chamado?</p>
            <div className="flex gap-3">
              <button
                onClick={handleNew}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold hover:from-blue-700 hover:to-blue-900 transition shadow-md shadow-blue-500/30"
              >
                Sim
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Não
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
