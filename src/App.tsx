import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { DrawerHost } from '@/components/DrawerHost';
import { CommandBar } from '@/components/CommandBar';
import { useApp } from '@/state/AppContext';
import { CommandPage } from '@/pages/Command';
import { PortfolioPage } from '@/pages/Portfolio';
import { CompanyPage } from '@/pages/Company';
import { OpportunitiesPage } from '@/pages/Opportunities';
import { AgentDetailPage, AgentsPage } from '@/pages/Agents';
import { ActivityPage } from '@/pages/Activity';
import { SettingsPage } from '@/pages/Settings';
import { OnboardingPage } from '@/pages/Onboarding';

export default function App() {
  const { onboarded } = useApp();

  if (!onboarded) return <OnboardingPage />;

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="scroll-thin flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<CommandPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/company/:id" element={<CompanyPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/:id" element={<OpportunitiesPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:id" element={<AgentDetailPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PersistentCommandBar />
      </main>
      <DrawerHost />
      <CommandPalette />
    </div>
  );
}

/**
 * The command bar follows the user everywhere except the Command page, which has
 * its own. The point of the product is that you never have to navigate back to a
 * search box to ask something.
 */
function PersistentCommandBar() {
  const { pathname } = useLocation();
  if (pathname === '/') return null;

  return (
    <div className="sticky bottom-0 border-t border-line bg-canvas px-8 py-3">
      <div className="mx-auto max-w-[1100px]">
        <CommandBar size="sm" placeholder="Ask Company Brain…" />
      </div>
    </div>
  );
}
