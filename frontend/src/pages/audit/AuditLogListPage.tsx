import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  History, 
  HelpCircle, 
  User, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';
import { getProjectByIdWithinOrganization } from '../../services/projectService';
import { getEnvironmentAuditLogs } from '../../services/auditService';
import { type Project, type AuditLog } from '../../types';

export const AuditLogListPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  
  // Environment Context
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [activeEnvName, setActiveEnvName] = useState<string | null>(null);

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchEnvContext = () => {
    const envId = localStorage.getItem('activeEnvironmentId');
    const envName = localStorage.getItem('activeEnvironmentName');
    setActiveEnvId(envId);
    setActiveEnvName(envName);
    // Reset page and clear previous environment's data on environment switch
    setPage(0);
    setLogs([]);
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchEnvContext();
    window.addEventListener('envChanged', fetchEnvContext);
    return () => window.removeEventListener('envChanged', fetchEnvContext);
  }, []);

  const loadProjectDetails = async () => {
    if (!projectId) return;
    try {
      const response = await getProjectByIdWithinOrganization(projectId);
      if (response.data) {
        setProject(response.data);
      }
    } catch (err) {
      console.error('Failed to load project details for audit logs', err);
    }
  };

  const loadAuditLogs = async () => {
    if (!activeEnvId) {
      setLogs([]);
      setTotalPages(1);
      setTotalElements(0);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await getEnvironmentAuditLogs(activeEnvId, page, 15);
      if (response.data) {
        setLogs(response.data.content || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalElements(response.data.totalElements || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/exhaustive-deps */
    loadProjectDetails();
  }, [projectId]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    loadAuditLogs();
  }, [activeEnvId, page]);

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'PROJECT_CREATED': return 'Project created';
      case 'PROJECT_UPDATED': return 'Project updated';
      case 'PROJECT_DELETED': return 'Project deleted';
      case 'ENVIRONMENT_CREATED': return 'Environment created';
      case 'ENVIRONMENT_UPDATED': return 'Environment updated';
      case 'ENVIRONMENT_DELETED': return 'Environment deleted';
      case 'FEATURE_CREATED': return 'Feature flag created';
      case 'FEATURE_UPDATED': return 'Feature flag updated';
      case 'FEATURE_DELETED': return 'Feature flag deleted';
      case 'FEATURE_TOGGLED': return 'Feature flag toggled';
      case 'API_KEY_CREATED': return 'API key created';
      case 'API_KEY_ROTATED': return 'API key rotated';
      default: 
        return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
    }
  };

  const formatValue = (value: string | undefined): { text: string; isToggle: boolean; enabled?: boolean } => {
    if (!value) return { text: '—', isToggle: false };
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && 'enabled' in parsed) {
        return { 
          text: parsed.enabled ? 'ON' : 'OFF', 
          isToggle: true, 
          enabled: parsed.enabled 
        };
      }
      return { text: JSON.stringify(parsed, null, 2), isToggle: false };
    } catch {
      return { text: value, isToggle: false };
    }
  };

  const renderChanges = (log: AuditLog) => {
    const oldFmt = formatValue(log.oldValue);
    const newFmt = formatValue(log.newValue);

    if (oldFmt.isToggle && newFmt.isToggle) {
      return (
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className={`px-1.5 py-0.5 rounded font-bold ${
            oldFmt.enabled 
              ? 'bg-[#131311]/5 text-[#575755]' 
              : 'bg-[#131311]/5 text-[#8d8d8a]'
          }`}>
            {oldFmt.text}
          </span>
          <span className="text-[#8d8d8a]">&rarr;</span>
          <span className={`px-1.5 py-0.5 rounded font-bold ${
            newFmt.enabled 
              ? 'bg-green-50 text-green-700 border border-green-100' 
              : 'bg-gray-50 text-gray-500 border border-gray-100'
          }`}>
            {newFmt.text}
          </span>
        </div>
      );
    }

    if (!log.oldValue && log.newValue) {
      return (
        <div className="text-[11px] text-[#575755] font-sans">
          Created with initial settings
        </div>
      );
    }

    if (log.oldValue && !log.newValue) {
      return (
        <div className="text-[11px] text-[#8d8d8a] font-sans">
          Resource removed
        </div>
      );
    }

    return (
      <div className="text-[10px] text-[#8d8d8a] font-mono">
        Metadata modified
      </div>
    );
  };


  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto">
      {/* Header — Manus ink-surface hero pattern */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)] p-7 text-[var(--cream)] sm:p-10">
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,rgba(255,253,246,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,253,246,.2)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--color-lime)]">Traceable release decisions</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-[.9] sm:text-5xl">Every change leaves context behind.</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--cream)]/70">
            A release history should explain what changed, where it changed, and when the decision was made.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="label-mono text-[var(--cream)]/60">Project: {project?.name || '—'}</span>
            <span className="text-[var(--cream)]/30 font-mono text-[10px]">/</span>
            <span className="label-mono text-[var(--color-lime)]">Environment: {activeEnvName || '—'}</span>
            {activeEnvId && (
              <button
                onClick={loadAuditLogs}
                disabled={isLoading}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--cream)]/20 bg-[var(--cream)]/10 px-3 py-1.5 font-mono text-[10px] font-semibold text-[var(--cream)] transition hover:bg-[var(--cream)]/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Connection / API Error Banner */}
      {error && (
        <div className="p-4 bg-red-50/50 border border-red-200/60 rounded-xl flex items-start justify-between gap-4 shadow-3xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-mono font-bold text-red-700 text-xs uppercase mb-0.5">Audit log synchronization failed</h4>
              <p className="text-red-600 font-sans text-xs">{error}</p>
            </div>
          </div>
          <button 
            onClick={loadAuditLogs} 
            className="font-mono text-[10px] font-bold bg-white hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 shadow-3xs cursor-pointer transition-colors"
          >
            RETRY FETCH
          </button>
        </div>
      )}

      {/* No active environment warning */}
      {!activeEnvId && !isLoading ? (
        <div className="border border-dashed border-[#131311]/12 bg-[#f3f2ea]/10 p-12 flex flex-col items-center justify-center min-h-[300px] text-[#8d8d8a] text-center rounded-xl">
          <History className="w-10 h-10 text-[#131311]/15 mb-3" />
          <span className="font-mono text-xs uppercase tracking-wider mb-1.5 text-[#131311] font-bold">No Environment Selected</span>
          <p className="text-xs max-w-xs leading-relaxed font-sans">
            Please choose or create an environment using the top dropdown selector to display the audit history.
          </p>
        </div>
      ) : isLoading && logs.length === 0 ? (
        /* Loading skeleton list */
        <div className="space-y-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white border border-[#131311]/6 p-5 h-24 flex items-center justify-between rounded-xl animate-pulse">
              <div className="space-y-2.5 flex-1">
                <div className="w-48 h-4 bg-[#f3f2ea] rounded"></div>
                <div className="w-32 h-3 bg-[#f3f2ea] rounded"></div>
              </div>
              <div className="w-24 h-6 bg-[#f3f2ea]/65 rounded"></div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        /* Empty State */
        <div className="border border-dashed border-[#131311]/12 bg-[#f3f2ea]/10 p-12 flex flex-col items-center justify-center min-h-[300px] text-[#8d8d8a] text-center rounded-xl">
          <History className="w-10 h-10 text-[#131311]/15 mb-3" />
          <span className="font-mono text-xs uppercase tracking-wider mb-1.5 text-[#131311] font-bold">No activity recorded</span>
          <p className="text-xs max-w-xs leading-relaxed font-sans">
            Configuration modifications or client key rotations in this environment will be logged here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            {/* Audit log list — Manus AuditRow pattern */}
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
            <div>
              <p className="font-display text-xl">Environment audit log</p>
              <p className="mt-1 font-mono text-[10px] text-[var(--color-muted-text)]">Configuration changes recorded in this environment.</p>
            </div>
            <span className="rounded-full border border-[var(--color-line)] px-2 py-1 font-mono text-[9px] text-[var(--color-secondary-text)]">{totalElements} events</span>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isCreate = log.action.includes('CREATED');
              const isDelete = log.action.includes('DELETED');
              return (
                <div key={log.id} className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                  <div 
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="flex gap-4 px-5 py-4 cursor-pointer"
                  >
                    {/* Manus-style icon circle: lime for change/create, sand for review/delete */}
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full mt-0.5 ${
                      isCreate ? 'bg-[var(--color-lime)] text-[var(--color-ink)]' :
                      isDelete ? 'bg-[var(--color-conflict)]/15 text-[var(--color-conflict)]' :
                      'bg-[var(--color-sand)] text-[var(--color-secondary-text)]'
                    }`}>
                      <span className="block w-2 h-2 rounded-full" style={{ background: 'currentColor' }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{getActionLabel(log.action)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-secondary-text)]">
                          <User className="w-3 h-3" /> {log.userName || log.userEmail || 'System'}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-secondary-text)]">
                          <Calendar className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1">{renderChanges(log)}</div>
                    </div>
                    <button className="shrink-0 text-[var(--color-muted-text)] hover:text-[var(--color-foreground)] mt-0.5">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 bg-[var(--color-surface-subtle)] border-t border-[var(--color-line)]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-1">
                          <span className="label-mono">Previous Value</span>
                          <pre className="p-3 bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-secondary-text)] font-mono text-[10px] leading-relaxed rounded-lg overflow-x-auto max-h-48">
                            {log.oldValue ? formatValue(log.oldValue).text : '— (None)'}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <span className="label-mono">New Value</span>
                          <pre className="p-3 bg-[var(--color-surface)] border border-[var(--color-lime)]/30 text-[var(--color-secondary-text)] font-mono text-[10px] leading-relaxed rounded-lg overflow-x-auto max-h-48">
                            {log.newValue ? formatValue(log.newValue).text : '— (None)'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3.5 rounded-xl">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
                className="border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-foreground)] font-mono text-[10px] font-semibold py-1.5 px-3.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              <span className="font-mono text-xs text-[var(--color-secondary-text)]">
                Page <span className="font-semibold text-[var(--color-foreground)]">{page + 1}</span> of <span className="font-semibold text-[var(--color-foreground)]">{totalPages}</span> ({totalElements} events)
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                className="border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-foreground)] font-mono text-[10px] font-semibold py-1.5 px-3.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom Help text */}
      <div className="mt-4 pt-5 border-t border-[#131311]/8 flex items-start gap-3.5 text-xs text-[#8d8d8a] leading-relaxed">
        <HelpCircle className="w-4.5 h-4.5 text-[#131311]/20 shrink-0" />
        <div>
          <h4 className="font-mono font-bold text-[#131311] uppercase mb-0.5 text-[11px]">Audit persistence and security</h4>
          <p className="max-w-2xl font-sans">
            Audit logs are immutable ledgers containing details of flag operations, environment creations, and API key updates. Secrets and raw cryptographic parameters are automatically omitted from change diff entries.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogListPage;
