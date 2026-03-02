import { useState, type ReactNode } from 'react';
import { type ExpertType } from '@/services/expertChatService';
import { useExpertDiagnostic } from '@/hooks/useExpertDiagnostic';
import { ExpertChatButton } from './ExpertChatButton';
import { ExpertChatPanel } from './ExpertChatPanel';
import { ExpertAlertBanner } from './ExpertAlertBanner';

interface ExpertChatWrapperProps {
  projectId: string;
  expertType: ExpertType;
  children: ReactNode;
}

export function ExpertChatWrapper({ projectId, expertType, children }: ExpertChatWrapperProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const {
    result,
    isLoading,
    dismissed,
    criticalCount,
    refresh,
    dismiss,
  } = useExpertDiagnostic(projectId, expertType);

  return (
    <>
      <ExpertAlertBanner
        expertType={expertType}
        result={result}
        isLoading={isLoading}
        dismissed={dismissed}
        onDismiss={dismiss}
        onRefresh={refresh}
        onOpenChat={() => setPanelOpen(true)}
      />

      {children}

      <ExpertChatButton
        expertType={expertType}
        onClick={() => setPanelOpen(true)}
        criticalCount={criticalCount}
      />

      <ExpertChatPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        projectId={projectId}
        expertType={expertType}
      />
    </>
  );
}
