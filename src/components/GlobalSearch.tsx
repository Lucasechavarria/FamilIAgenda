import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from 'react';
import {
  Search,
  X,
  Calendar,
  CheckSquare,
  MessageSquare,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ResultType = 'event' | 'task' | 'chat';
type FilterType = 'all' | ResultType;

interface SearchResultItem {
  id: number;
  type: ResultType;
  title: string;
  subtitle?: string;
  category?: string;
  status?: string;
  date?: string;
  family_id?: number;
}

interface SearchResultsRead {
  query: string;
  total: number;
  events: SearchResultItem[];
  tasks: SearchResultItem[];
  chat: SearchResultItem[];
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'calendar' | 'tasks' | 'metrics') => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const apiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getToken = () => localStorage.getItem('access_token') ?? '';

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

// ─── Metadata por tipo ────────────────────────────────────────────────────────

const TYPE_META: Record<ResultType, { label: string; Icon: React.ElementType; color: string; bgColor: string; navigate: 'calendar' | 'tasks' | 'metrics' }> = {
  event: {
    label: 'Eventos',
    Icon: Calendar,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15 border-cyan-500/30',
    navigate: 'calendar',
  },
  task: {
    label: 'Tareas',
    Icon: CheckSquare,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/15 border-violet-500/30',
    navigate: 'tasks',
  },
  chat: {
    label: 'Chat',
    Icon: MessageSquare,
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/15 border-fuchsia-500/30',
    navigate: 'calendar',
  },
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending:    { text: 'Pendiente',  cls: 'text-amber-400 bg-amber-500/10' },
  in_progress:{ text: 'En progreso',cls: 'text-blue-400  bg-blue-500/10'  },
  completed:  { text: 'Completado', cls: 'text-green-400 bg-green-500/10' },
  cancelled:  { text: 'Cancelado',  cls: 'text-red-400   bg-red-500/10'   },
};

// ─── Componente de un ítem de resultado ──────────────────────────────────────

const ResultItem: React.FC<{
  item: SearchResultItem;
  isActive: boolean;
  onSelect: () => void;
  query: string;
}> = ({ item, isActive, onSelect, query }) => {
  const meta = TYPE_META[item.type];
  const Icon = meta.Icon;
  const status = item.status ? STATUS_LABEL[item.status] : undefined;

  // Resaltar la coincidencia de búsqueda en el título
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary-500/30 text-primary-200 dark:text-primary-300 rounded px-0.5 mx-px ring-1 ring-primary-500/20">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 rounded-xl mx-1',
        'border border-transparent',
        isActive
          ? `${meta.bgColor} border-current shadow-lg scale-[1.01]`
          : 'hover:bg-white/5 hover:border-white/10',
      ].join(' ')}
    >
      {/* Ícono de tipo */}
      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${meta.bgColor}`}>
        <Icon className={`w-4 h-4 ${meta.color}`} aria-hidden="true" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate leading-snug">
          {highlightMatch(item.title, query)}
        </p>
        {item.subtitle && (
          <p className="text-xs text-slate-400 truncate mt-0.5 leading-snug">
            {item.subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {item.category && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white/5 rounded px-1.5 py-0.5">
              {item.category}
            </span>
          )}
          {status && (
            <span className={`text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 ${status.cls}`}>
              {status.text}
            </span>
          )}
          {item.date && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" aria-hidden="true" />
              {formatDate(item.date)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ─── Esqueleto de carga ───────────────────────────────────────────────────────

const SearchSkeleton: React.FC = () => (
  <div className="px-2 py-3 space-y-2 animate-pulse" aria-busy="true" aria-label="Cargando resultados">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-start gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-2.5 bg-white/5 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchId = useId();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<SearchResultsRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sugerencias para el estado vacío
  const SUGGESTED_QUERIES = [
    { text: 'Médico', icon: '🏥' },
    { text: 'Súper', icon: '🛒' },
    { text: 'Escuela', icon: '🏫' },
    { text: 'Cena', icon: '🍽️' },
  ];

  // Aplanar resultados según filtro activo
  const flatResults = React.useMemo<SearchResultItem[]>(() => {
    if (!results) return [];
    const all = [
      ...(results.events ?? []),
      ...(results.tasks ?? []),
      ...(results.chat ?? []),
    ];
    if (filter === 'all') return all;
    return all.filter((r) => r.type === filter);
  }, [results, filter]);

  // Ejecutar búsqueda
  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Backend espera singular: 'events', 'tasks', 'chat'
      const typeParam = filter === 'all' ? '' : `&types=${filter === 'chat' ? 'chat' : filter + 's'}`;
      
      const { data } = await axios.get<SearchResultsRead>(
        `${apiUrl()}/api/search/?q=${encodeURIComponent(q)}${typeParam}&limit=8`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setResults(data);
      setActiveIdx(0);
    } catch {
      setError('No se pudo realizar la búsqueda. Verifica tu conexión.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Debounce del input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filter, runSearch]);

  // Foco al abrir + Feedback
  useEffect(() => {
    if (isOpen) {
      import('@/lib/UXInteractions').then(({ UXFeedback }) => {
        UXFeedback.playSound('pop');
      });
      setQuery('');
      setResults(null);
      setError(null);
      setFilter('all');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Escape para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Navegación con teclado ↑ ↓ Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!flatResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatResults[activeIdx];
      if (item) selectResult(item);
    }
  };

  const selectResult = (item: SearchResultItem) => {
    import('@/lib/UXInteractions').then(({ UXFeedback }) => {
      UXFeedback.playSound('success');
      UXFeedback.vibrate('light');
    });
    const view = TYPE_META[item.type].navigate;
    onNavigate(view);
    onClose();
  };

  if (!isOpen) return null;

  const hasResults = flatResults.length > 0;
  const showEmpty = !loading && !error && query.length >= 2 && !hasResults;

  // ─── Grupos de resultados filtrados ────────────────────────────────────────
  const groups: Array<{ type: ResultType; items: SearchResultItem[] }> = [
    { type: 'event' as const, items: filter === 'all' || filter === 'event' ? (results?.events ?? []) : [] },
    { type: 'task'  as const, items: filter === 'all' || filter === 'task'  ? (results?.tasks  ?? []) : [] },
    { type: 'chat'  as const, items: filter === 'all' || filter === 'chat'  ? (results?.chat   ?? []) : [] },
  ].filter((g) => g.items.length > 0);

  let globalIdx = 0; // Contador global para índice activo

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda global"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Fondo difuminado */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-hidden="true" />

      {/* Panel de búsqueda */}
      <div
        className="relative w-full max-w-2xl glass-panel shadow-2xl overflow-hidden"
        style={{ animation: 'search-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >

        {/* ─── Barra de búsqueda ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <Search
            className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
              loading ? 'text-cyan-400 animate-pulse' : 'text-slate-400'
            }`}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id={`global-search-input-${searchId}`}
            type="search"
            role="combobox"
            aria-expanded={hasResults}
            aria-controls={`search-listbox-${searchId}`}
            aria-activedescendant={hasResults ? `search-item-${activeIdx}` : undefined}
            autoComplete="off"
            placeholder="Buscar eventos, tareas, mensajes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
          />
          <div className="flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono text-slate-500 border border-white/10 bg-white/5">
              Esc
            </kbd>
          </div>
        </div>

        {/* ─── Chips de filtro ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          {(['all', 'event', 'task', 'chat'] as FilterType[]).map((f) => {
            const isActive = filter === f;
            const label = f === 'all' ? 'Todo' : TYPE_META[f].label;
            const color = f === 'all' ? 'text-slate-300' : TYPE_META[f].color;
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  import('@/lib/UXInteractions').then(({ UXFeedback }) => {
                    UXFeedback.playSound('click');
                  });
                  setFilter(f);
                }}
                className={[
                  'px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200',
                  isActive
                    ? `bg-white/15 border border-white/20 ${color}`
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
          {results && results.total > 0 && (
            <span className="ml-auto text-xs text-slate-500">
              {results.total} resultado{results.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ─── Resultados ────────────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          id={`search-listbox-${searchId}`}
          role="listbox"
          className="max-h-[52vh] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >

          {/* Estado vacío inicial */}
           {!query && (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                <Zap className="w-8 h-8 text-secondary-400" />
              </div>
              <p className="text-sm font-bold text-white mb-1 uppercase tracking-widest text-[10px] opacity-60">Poder de Búsqueda</p>
              <p className="text-sm font-medium text-slate-300 max-w-[280px] mb-6">Encuentra cualquier evento, tarea o mensaje al instante.</p>
              
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUERIES.map((sug) => (
                  <button
                    key={sug.text}
                    onClick={() => setQuery(sug.text)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white transition-all transform hover:scale-105"
                  >
                    <span>{sug.icon}</span>
                    <span>{sug.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && <SearchSkeleton />}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-center gap-3 px-5 py-4 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Sin resultados */}
          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
              <Search className="w-7 h-7 text-slate-600" />
              <p className="text-sm font-medium">Sin resultados para "{query}"</p>
              <p className="text-xs text-slate-600">Intenta con otro término o filtro</p>
            </div>
          )}

          {/* Resultados agrupados */}
          {!loading && groups.map(({ type, items }) => {
            const meta = TYPE_META[type];
            const GroupIcon = meta.Icon;
            return (
              <div key={type}>
                {/* Cabecera del grupo */}
                <div className="flex items-center gap-2 px-5 py-2 mt-1">
                  <GroupIcon className={`w-3.5 h-3.5 ${meta.color}`} aria-hidden="true" />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Ítems del grupo */}
                <div role="group" aria-label={meta.label}>
                  {items.map((item) => {
                    const myIdx = globalIdx++;
                    return (
                      <ResultItem
                        key={`${item.type}-${item.id}`}
                        item={item}
                        isActive={activeIdx === myIdx}
                        onSelect={() => selectResult(item)}
                        query={query}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Footer ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-white/5 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white/5 border border-white/10 rounded px-1.5 py-0.5">↑↓</kbd>
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white/5 border border-white/10 rounded px-1.5 py-0.5">Enter</kbd>
            Abrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white/5 border border-white/10 rounded px-1.5 py-0.5">Esc</kbd>
            Cerrar
          </span>
        </div>
      </div>

      {/* Animación de entrada */}
      <style>{`
        @keyframes search-in {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
    </div>
  );
};
