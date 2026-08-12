import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { actions as seedActions, activity as seedActivity, holdingCompany } from '@/data';
import type { Action, ActionStatus, ActivityEvent } from '@/data/types';
import { resolve } from '@/engine/query';
import type { AIResponse } from '@/engine/types';

/**
 * Drawers stack rather than replace: clicking a metric inside an approval
 * drawer should open evidence on top of it and come back, which is the
 * interaction the whole trust model depends on.
 */
export type DrawerRef =
  | { kind: 'evidence'; id: string }
  | { kind: 'approval'; id: string }
  | { kind: 'opportunity'; id: string }
  | { kind: 'company'; id: string };

export interface Conversation {
  id: string;
  query: string;
  response: AIResponse | null;
  /** True while the simulated retrieval is running. */
  pending: boolean;
}

interface AppState {
  user: { name: string; email: string; role: 'Owner' | 'Admin' | 'Operator' | 'Viewer' };
  holding: typeof holdingCompany;

  /** null means the entire portfolio. */
  scope: string | null;
  setScope: (id: string | null) => void;

  drawers: DrawerRef[];
  openDrawer: (ref: DrawerRef) => void;
  closeDrawer: () => void;
  closeAllDrawers: () => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  conversation: Conversation[];
  ask: (query: string) => void;
  clearConversation: () => void;

  /** Session-local decisions layered over the seed data. */
  actions: Action[];
  decide: (id: string, decision: 'approved' | 'rejected') => void;
  pending: Action[];

  activity: ActivityEvent[];

  onboarded: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const AppContext = createContext<AppState | null>(null);

const ONBOARD_KEY = 'company-brain.onboarded';

/**
 * Storage access throws outright in sandboxed frames and in some private
 * browsing modes, so onboarding state degrades to in-memory rather than taking
 * the app down with it.
 */
const store = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* Non-persistent session; the in-memory flag still holds for this visit. */
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* As above. */
    }
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scope, setScope] = useState<string | null>(null);
  const [drawers, setDrawers] = useState<DrawerRef[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [actionState, setActionState] = useState<Action[]>(seedActions);
  const [extraActivity, setExtraActivity] = useState<ActivityEvent[]>([]);
  const [onboarded, setOnboarded] = useState<boolean>(
    () => typeof window !== 'undefined' && store.get(ONBOARD_KEY) === '1',
  );

  const user = useMemo(
    () => ({ name: 'Alex', email: 'alex@redwoodholdings.com', role: 'Owner' as const }),
    [],
  );

  const openDrawer = useCallback((ref: DrawerRef) => {
    setDrawers((prev) => {
      const top = prev[prev.length - 1];
      if (top && top.kind === ref.kind && top.id === ref.id) return prev;
      return [...prev, ref];
    });
  }, []);

  const closeDrawer = useCallback(() => setDrawers((prev) => prev.slice(0, -1)), []);
  const closeAllDrawers = useCallback(() => setDrawers([]), []);

  const ask = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // Asking always lands on Command, from wherever it was asked.
      setDrawers([]);
      setPaletteOpen(false);
      if (location.pathname !== '/') navigate('/');

      const id = `conv-${Date.now()}`;
      setConversation((prev) => [...prev, { id, query: trimmed, response: null, pending: true }]);

      // Resolution is synchronous, but answers land with a short delay so the
      // retrieval step is visible rather than instantaneous and unexplained.
      const response = resolve(trimmed, scope, user.name);
      window.setTimeout(() => {
        setConversation((prev) =>
          prev.map((c) => (c.id === id ? { ...c, response, pending: false } : c)),
        );
      }, response.latency_ms);
    },
    [scope, user.name, navigate, location.pathname],
  );

  const clearConversation = useCallback(() => setConversation([]), []);

  const decide = useCallback(
    (id: string, decision: 'approved' | 'rejected') => {
      const target = actionState.find((a) => a.id === id);
      if (!target) return;

      const status: ActionStatus = decision === 'approved' ? 'executed' : 'rejected';
      const at = new Date().toISOString();

      setActionState((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status, decided_by: user.name, decided_at: at } : a,
        ),
      );

      setExtraActivity((prev) => [
        {
          id: `ac-live-${id}-${Date.now()}`,
          company_id: target.company_id,
          holding_company_id: 'redwood',
          source: 'company-brain',
          created_at: at,
          updated_at: at,
          at,
          actor: user.name,
          actor_kind: 'human',
          verb: decision === 'approved' ? 'approved' : 'rejected',
          object: target.title,
          detail:
            decision === 'approved'
              ? `Level ${target.level} action executed · ${target.impact}`
              : `Level ${target.level} action declined`,
          level: target.level,
          link: `/agents/${target.agent_id}`,
        },
        ...prev,
      ]);
    },
    [actionState, user.name],
  );

  const completeOnboarding = useCallback(() => {
    store.set(ONBOARD_KEY, '1');
    setOnboarded(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    store.remove(ONBOARD_KEY);
    setOnboarded(false);
  }, []);

  // ⌘K / Ctrl+K opens the palette anywhere; Escape unwinds one drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        setDrawers((prev) => (prev.length ? prev.slice(0, -1) : prev));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value: AppState = useMemo(
    () => ({
      user,
      holding: holdingCompany,
      scope,
      setScope,
      drawers,
      openDrawer,
      closeDrawer,
      closeAllDrawers,
      paletteOpen,
      setPaletteOpen,
      conversation,
      ask,
      clearConversation,
      actions: actionState,
      decide,
      pending: actionState.filter((a) => a.status === 'pending-approval'),
      activity: [...extraActivity, ...seedActivity],
      onboarded,
      completeOnboarding,
      resetOnboarding,
    }),
    [
      user,
      scope,
      drawers,
      openDrawer,
      closeDrawer,
      closeAllDrawers,
      paletteOpen,
      conversation,
      ask,
      clearConversation,
      actionState,
      decide,
      extraActivity,
      onboarded,
      completeOnboarding,
      resetOnboarding,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
