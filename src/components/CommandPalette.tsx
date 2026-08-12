import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { search, type SearchResult } from '@/lib/search';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openDrawer, setScope, ask } = useApp();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [index, setIndex] = useState(0);

  const results = useMemo(() => search(term), [term]);

  useEffect(() => {
    if (!paletteOpen) {
      setTerm('');
      setIndex(0);
    }
  }, [paletteOpen]);

  useEffect(() => setIndex(0), [term]);

  if (!paletteOpen) return null;

  const run = (r: SearchResult) => {
    setPaletteOpen(false);
    switch (r.action.type) {
      case 'route':
        navigate(r.action.to);
        break;
      case 'drawer':
        openDrawer({ kind: r.action.kind, id: r.action.id });
        break;
      case 'scope':
        setScope(r.action.id);
        break;
      case 'query':
        navigate('/');
        ask(r.action.text);
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={() => setPaletteOpen(false)}
        className="absolute inset-0 animate-fade-in bg-ink/[0.14]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative w-full max-w-[600px] animate-rise border border-line bg-paper shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 text-faint">
            <circle cx="5.75" cy="5.75" r="4.25" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.25 9.25L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex((i) => (i + 1) % results.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex((i) => (i - 1 + results.length) % results.length);
              } else if (e.key === 'Enter' && results[index]) {
                e.preventDefault();
                run(results[index]);
              } else if (e.key === 'Escape') {
                setPaletteOpen(false);
              }
            }}
            placeholder="Search companies, vendors, customers, metrics, agents…"
            className="flex-1 bg-transparent text-lg placeholder:text-faint"
          />
          <span className="kbd shrink-0">esc</span>
        </div>

        <div className="scroll-thin max-h-[52vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-4 py-6 text-base text-muted">
              Nothing matched. Company Brain will not invent a result — try a company, vendor or
              metric name.
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onMouseEnter={() => setIndex(i)}
              onClick={() => run(r)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                i === index && 'bg-rail',
              )}
            >
              <span className="w-[74px] shrink-0">
                <span className="eyebrow">{r.kind}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-ink">{r.title}</span>
                <span className="mt-0.5 block truncate text-sm text-muted">{r.meta}</span>
              </span>
              {i === index && <span className="kbd-glyph shrink-0">↵</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-line bg-canvas px-4 py-2">
          <span className="text-sm text-muted">
            <span className="kbd-glyph mr-1.5">↑↓</span>navigate
          </span>
          <span className="text-sm text-muted">
            <span className="kbd-glyph mr-1.5">↵</span>open
          </span>
          <span className="ml-auto text-sm text-faint">
            Searches every connected system, not just this page
          </span>
        </div>
      </div>
    </div>
  );
}
