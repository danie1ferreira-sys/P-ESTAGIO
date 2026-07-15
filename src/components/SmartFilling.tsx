import { useState } from 'react';
import { analyzeConversation } from '../utils/aiService';

interface SmartFillingProps {
  apiKey: string;
  onFieldsFilled: (fields: Record<string, string>) => void;
  onComplete: () => void;
  setToast: (msg: string) => void;
}

export default function SmartFilling({ apiKey, onFieldsFilled, onComplete, setToast }: SmartFillingProps) {
  const [conversation, setConversation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!conversation.trim()) {
      setError('Por favor, cole a conversa para analisar.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await analyzeConversation(conversation, apiKey);
      onFieldsFilled(result);
      setToast('Campos preenchidos com sucesso.');
      // Small timeout to let the user see the success state before changing tab
      setTimeout(() => {
        onComplete();
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao analisar a conversa.');
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 p-6 sm:p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 text-2xl mb-3">
            ⚠️
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Chave de API do Gemini não configurada</h3>
          <p className="text-sm text-slate-600 max-w-md">
            O preenchimento inteligente necessita de uma chave de API do Gemini. Peça a um administrador para configurá-la em <strong>Painel do Administrador &gt; Configurações &gt; Configurações Gerais</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5" />
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>✨</span> Preenchimento Inteligente do Atendimento
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Cole toda a conversa (WhatsApp, chat ou e-mail) no campo abaixo. A IA interpretará o atendimento técnico automaticamente preenchendo a descrição e solução.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Histórico Completo da Conversa <span className="text-red-500">*</span>
          </label>
          <textarea
            value={conversation}
            onChange={(e) => {
              setConversation(e.target.value);
              if (error) setError('');
            }}
            placeholder="Cole o chat ou e-mail aqui..."
            rows={12}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-sm resize-y"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analisando conversa...
              </>
            ) : (
              <>
                <span>✨</span> Analisar Conversa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
