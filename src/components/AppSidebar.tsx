import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { initials } from '@/lib/format';
import { PortfolioSwitcher } from './PortfolioSwitcher';

const NAV = [
  { to: '/', label: 'Command', end: true },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/agents', label: 'Agents' },
  { to: '/activity', label: 'Activity' },
];

export function AppSidebar() {
  const { holding, user, pending, setPaletteOpen } = useApp();

  return (
    <aside className="flex w-[212px] shrink-0 flex-col border-r border-line bg-rail">
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-[18px] items-center justify-center rounded-sm bg-ink font-mono text-[9px] font-bold text-white"
          >
            CB
          </span>
          <span className="text-sm font-semibold tracking-[-0.01em]">Company Brain</span>
        </div>
        <p className="mt-1.5 truncate pl-[26px] text-xs text-muted">{holding.name}</p>
      </div>

      <div className="border-y border-line bg-canvas/60 px-3 py-2.5">
        <PortfolioSwitcher />
      </div>

      <nav className="flex-1 px-2 py-3">
        <ul className="space-y-px">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded px-2 py-[5px] text-base transition-colors',
                    isActive
                      ? 'bg-paper font-medium text-ink shadow-subtle'
                      : 'text-muted hover:bg-paper/60 hover:text-ink',
                  )
                }
              >
                {item.label}
                {item.label === 'Agents' && pending.length > 0 && (
                  <span className="tnum flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-ink px-1 text-[9px] font-semibold text-white">
                    {pending.length}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mt-4 flex w-full items-center justify-between rounded px-2 py-[5px] text-base text-muted transition-colors hover:bg-paper/60 hover:text-ink"
        >
          Search
          <span className="flex gap-0.5">
            <span className="kbd-glyph">⌘</span>
            <span className="kbd">K</span>
          </span>
        </button>
      </nav>

      <div className="border-t border-line px-2 py-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center rounded px-2 py-[5px] text-base transition-colors',
              isActive ? 'bg-paper font-medium text-ink' : 'text-muted hover:bg-paper/60 hover:text-ink',
            )
          }
        >
          Settings
        </NavLink>
        <div className="mt-1 flex items-center gap-2 rounded px-2 py-1.5">
          <span
            aria-hidden
            className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper text-[10px] font-semibold text-ink-2"
          >
            {initials(user.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-xs text-muted">{user.role}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
