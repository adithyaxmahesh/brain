import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { companies } from '@/data';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';

const SLASH_COMMANDS = [
  { name: 'compare', hint: 'Compare two companies on a metric', template: '/compare @Atlas @Beacon sales efficiency' },
  { name: 'brief', hint: "Today's portfolio brief", template: '/brief' },
  { name: 'savings', hint: 'Find cost savings across the portfolio', template: '/savings $500K' },
  { name: 'risk', hint: 'Customers and accounts at risk', template: '/risk' },
  { name: 'deploy', hint: 'Deploy a workflow from one company to another', template: "/deploy Atlas's lead follow-up process to Northstar" },
  { name: 'vendors', hint: 'Duplicate and fragmented vendor spend', template: '/vendors duplicates' },
];

const DATE_RANGES = ['last 30 days', 'last 90 days', 'last 12 months', 'this month', 'this week'];

/**
 * The primary interface. Natural language first, with mentions, slash commands,
 * attachments and date ranges as accelerants rather than as required syntax.
 */
export function CommandBar({
  size = 'lg',
  placeholder = 'Ask anything about your portfolio',
  autoFocus = false,
}: {
  size?: 'lg' | 'sm';
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const { ask, scope } = useApp();
  const [value, setValue] = useState('');
  const [range, setRange] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // The token being typed decides which menu is open.
  const activeToken = useMemo(() => {
    const match = value.match(/(^|\s)([@/])([\w'-]*)$/);
    if (!match) return null;
    return { trigger: match[2] as '@' | '/', term: match[3].toLowerCase() };
  }, [value]);

  const mentionMatches = useMemo(() => {
    if (activeToken?.trigger !== '@') return [];
    return companies.filter(
      (c) =>
        c.handle.toLowerCase().startsWith(activeToken.term) ||
        c.name.toLowerCase().includes(activeToken.term),
    );
  }, [activeToken]);

  const slashMatches = useMemo(() => {
    if (activeToken?.trigger !== '/') return [];
    return SLASH_COMMANDS.filter((c) => c.name.startsWith(activeToken.term));
  }, [activeToken]);

  const menuOpen = mentionMatches.length > 0 || slashMatches.length > 0;
  const menuLength = mentionMatches.length || slashMatches.length;

  const applyMention = (handle: string) => {
    setValue((v) => v.replace(/([@])([\w'-]*)$/, `@${handle} `));
    inputRef.current?.focus();
    setHighlight(0);
  };

  const applySlash = (template: string) => {
    setValue(template);
    inputRef.current?.focus();
    setHighlight(0);
  };

  const submit = () => {
    const parts = [value.trim()];
    if (range) parts.push(`over the ${range}`);
    if (attachments.length) parts.push(`(attached: ${attachments.join(', ')})`);
    const q = parts.filter(Boolean).join(' ');
    if (!q) return;
    ask(q);
    setValue('');
    setRange(null);
    setAttachments([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => (h + 1) % menuLength);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => (h - 1 + menuLength) % menuLength);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        if (mentionMatches.length) applyMention(mentionMatches[highlight].handle);
        else applySlash(slashMatches[highlight].template);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setValue((v) => v.replace(/([@/])([\w'-]*)$/, ''));
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'border border-line-strong bg-paper shadow-subtle transition-colors focus-within:border-ink/40',
          size === 'lg' ? 'px-4 pt-3.5' : 'px-3 pt-2.5',
        )}
      >
        <textarea
          ref={inputRef}
          autoFocus={autoFocus}
          rows={size === 'lg' ? 2 : 1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            'block w-full resize-none bg-transparent leading-relaxed placeholder:text-faint',
            size === 'lg' ? 'text-xl' : 'text-base',
          )}
        />

        <div
          className={cn(
            'flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-line',
            size === 'lg' ? 'mt-3 py-2.5' : 'mt-2 py-2',
          )}
        >
          <button
            type="button"
            className="btn-ghost"
            title="Attach a file for Company Brain to read"
            onClick={() =>
              setAttachments((a) =>
                a.length ? a : ['Q3-board-package.pdf'],
              )
            }
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            Attach
          </button>

          <button
            type="button"
            className={cn('btn-ghost', range && 'text-ink')}
            onClick={() =>
              setRange((r) => {
                const i = r ? DATE_RANGES.indexOf(r) : -1;
                return i + 1 >= DATE_RANGES.length ? null : DATE_RANGES[i + 1];
              })
            }
            title="Cycle the time range"
          >
            {range ? `Over the ${range}` : 'Any time range'}
          </button>

          {attachments.map((a) => (
            <span key={a} className="chip normal-case tracking-normal">
              {a}
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((x) => x !== a))}
                className="text-faint transition-colors hover:text-ink"
                aria-label={`Remove ${a}`}
              >
                ×
              </button>
            </span>
          ))}

          <span className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-faint sm:inline">
              <span className="kbd mr-1.5">@</span>company
              <span className="kbd ml-3 mr-1.5">/</span>command
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              className="btn-primary"
            >
              Ask
              <span className="kbd-glyph border-white/25 bg-transparent text-white/70">↵</span>
            </button>
          </span>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 animate-fade-in border border-line bg-paper shadow-pop">
          {mentionMatches.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onClick={() => applyMention(c.handle)}
              className={cn(
                'flex w-full items-baseline justify-between gap-4 px-3.5 py-2 text-left transition-colors',
                i === highlight && 'bg-rail',
              )}
            >
              <span className="text-base">
                <span className="font-medium">@{c.handle}</span>{' '}
                <span className="text-muted">{c.name}</span>
              </span>
              <span className="text-sm text-faint">{c.sector}</span>
            </button>
          ))}
          {slashMatches.map((c, i) => (
            <button
              key={c.name}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onClick={() => applySlash(c.template)}
              className={cn(
                'flex w-full items-baseline justify-between gap-4 px-3.5 py-2 text-left transition-colors',
                i === highlight && 'bg-rail',
              )}
            >
              <span className="text-base font-medium">/{c.name}</span>
              <span className="text-sm text-muted">{c.hint}</span>
            </button>
          ))}
        </div>
      )}

      {scope && !menuOpen && (
        <p className="mt-2 text-sm text-muted">
          Scoped to <span className="text-ink">{companies.find((c) => c.id === scope)?.name}</span>.
          Mention another company with <span className="kbd">@</span> to compare across the portfolio.
        </p>
      )}
    </div>
  );
}
