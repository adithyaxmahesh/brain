import { useApp } from '@/state/AppContext';
import { ApprovalDrawer } from './ApprovalDrawer';
import { CompanyDrawer } from './CompanyDrawer';
import { EvidenceDrawer } from './EvidenceDrawer';
import { OpportunityDrawer } from './OpportunityDrawer';

/** Renders the drawer stack. Later entries sit on top of earlier ones. */
export function DrawerHost() {
  const { drawers } = useApp();

  return (
    <>
      {drawers.map((d, i) => {
        const key = `${d.kind}-${d.id}-${i}`;
        switch (d.kind) {
          case 'evidence':
            return <EvidenceDrawer key={key} id={d.id} depth={i} />;
          case 'approval':
            return <ApprovalDrawer key={key} id={d.id} depth={i} />;
          case 'opportunity':
            return <OpportunityDrawer key={key} id={d.id} depth={i} />;
          case 'company':
            return <CompanyDrawer key={key} id={d.id} depth={i} />;
          default:
            return null;
        }
      })}
    </>
  );
}
