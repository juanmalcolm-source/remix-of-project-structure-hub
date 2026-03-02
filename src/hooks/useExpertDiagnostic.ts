import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type ExpertType,
  type DiagnosticResult,
  runDiagnostic,
} from '@/services/expertChatService';

export function useExpertDiagnostic(projectId: string, expertType: ExpertType) {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasRun = useRef(false);

  const executeDiagnostic = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const diagnosticResult = await runDiagnostic(projectId, expertType);
      setResult(diagnosticResult);
    } catch (err) {
      console.error(`[ExpertDiagnostic] ${expertType} error:`, err);
      // Fail silently — don't block the section
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, expertType]);

  // Run once on mount
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    executeDiagnostic();
  }, [executeDiagnostic]);

  const refresh = useCallback(() => {
    setDismissed(false);
    executeDiagnostic();
  }, [executeDiagnostic]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const criticalCount = result?.alerts.filter(a => a.severity === 'critical').length || 0;
  const warningCount = result?.alerts.filter(a => a.severity === 'warning').length || 0;

  return {
    result,
    isLoading,
    dismissed,
    criticalCount,
    warningCount,
    refresh,
    dismiss,
  };
}
