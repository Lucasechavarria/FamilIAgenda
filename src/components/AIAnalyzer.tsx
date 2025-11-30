import React, { useState } from 'react';
import { Sparkles, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { calendarService } from '../services/api';
import { AIAnalysisResponse } from '../types';

export const AIAnalyzer: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResponse | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const response = await calendarService.analyzeSchedule(input);
      setResult(response);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-2 shadow-inner">
          <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analista de Agenda IA</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          Pídeme que analice tu semana, encuentre conflictos o sugiera actividades familiares basadas en el tiempo libre.
        </p>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
        <form onSubmit={handleAnalyze} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: 'Analiza mi semana y busca huecos libres para ir al cine'"
            className="flex-1 px-4 py-3 outline-none text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`p-3 rounded-xl flex items-center justify-center transition-all
              ${loading || !input.trim() 
                ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
            `}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Results Area */}
      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in-up">
          <div className="bg-primary-50/50 dark:bg-primary-900/20 p-6 border-b border-primary-100 dark:border-primary-900/50">
            <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Resumen del Análisis
            </h3>
            <p className="text-primary-800 dark:text-primary-200 leading-relaxed">
              {result.summary}
            </p>
          </div>
          
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-500" />
                Sugerencias
              </h4>
              <ul className="space-y-3">
                {result.suggestions.map((sug, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 bg-secondary-50 dark:bg-secondary-900/20 p-3 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-1.5 shrink-0" />
                    {sug}
                  </li>
                ))}
              </ul>
            </div>

            {result.conflicts.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-accent-500" />
                  Posibles Conflictos
                </h4>
                <ul className="space-y-3">
                  {result.conflicts.map((con, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 bg-accent-50 dark:bg-red-900/20 p-3 rounded-lg border border-accent-100 dark:border-red-900/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-1.5 shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="text-center">
        <span className="text-xs text-gray-400">Potenciado por Gemini AI</span>
      </div>
    </div>
  );
};