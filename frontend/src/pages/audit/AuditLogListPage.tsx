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

  const getLogDotColor = (action: string) => {
    if (action.includes('DELETED')) return 'bg-red-500';
    if (action.includes('CREATED')) return 'bg-green-500';
    if (action.includes('ROTATED') || action.includes('TOGGLED')) return 'bg-[#131311]';
    return 'bg-[#8d8d8a]';
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto">
      {/* Header */}
      <div className="border-b border-[#131311]/5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#131311]/40"></div>
              <span className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-widest">
                Project: {project?.name || '—'}
              </span>
              <span className="text-[#8d8d8a]/40 text-[9px] font-mono">/</span>
              <span className="font-mono text-[9px] text-[#131311] font-bold uppercase tracking-widest">
                Environment: {activeEnvName || '—'}
              </span>
            </div>
            <h2 className="font-display font-black text-2xl text-[#131311] uppercase tracking-tight">
              AUDIT LOGS
            </h2>
            <p className="text-xs text-[#8d8d8a] mt-0.5">
              Track configuration changes, environment events, and team activity.
            </p>
          </div>
          
          {/* Refresh Button */}
          {activeEnvId && (
            <button
              onClick={loadAuditLogs}
              disabled={isLoading}
              className="bg-white border border-[#131311]/12 hover:bg-[#f3f2ea]/20 text-[#131311] font-mono text-[10px] font-bold py-1.5 px-3 rounded-md transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
            </button>
          )}
        </div>
      </div>

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
        /* Audit logs list */
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-[#131311]/12 rounded-xl overflow-hidden shadow-3xs">
            <div className="divide-y divide-[#131311]/8">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="transition-colors hover:bg-[#f3f2ea]/5">
                    <div 
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Status indicator dot */}
                        <div className="mt-1.5 flex items-center justify-center">
                          <span className={`w-2 h-2 rounded-full ${getLogDotColor(log.action)}`}></span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="font-mono text-xs font-bold text-[#131311] uppercase tracking-wide">
                              {getActionLabel(log.action)}
                            </span>
                            <span className="text-[#8d8d8a] text-[10px]">&bull;</span>
                            <div className="flex items-center gap-1.5 text-[#575755] font-sans text-xs">
                              <User className="w-3.5 h-3.5 text-[#8d8d8a]/60 shrink-0" />
                              <span>{log.userName || log.userEmail || 'System'}</span>
                              <span className="text-[#8d8d8a]/50">({log.userEmail})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-[#8d8d8a] font-mono">
                            <Calendar className="w-3.5 h-3.5 text-[#8d8d8a]/60 shrink-0" />
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Summary of changes / Toggle */}
                      <div className="flex items-center gap-4">
                        {renderChanges(log)}
                        <button className="text-[#8d8d8a] hover:text-[#131311]">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable JSON Detail Area */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 bg-[#f3f2ea]/15 border-t border-[#131311]/5 divide-y divide-[#131311]/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {/* Previous Value block */}
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider font-bold">
                              Previous Value
                            </span>
                            <pre className="p-3 bg-white border border-[#131311]/8 text-[#575755] font-mono text-[10px] leading-relaxed rounded-lg overflow-x-auto max-h-48 shadow-3xs">
                              {log.oldValue ? formatValue(log.oldValue).text : '— (None)'}
                            </pre>
                          </div>

                          {/* New Value block */}
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider font-bold">
                              New Value
                            </span>
                            <pre className="p-3 bg-white border border-green-200/50 text-[#575755] font-mono text-[10px] leading-relaxed rounded-lg overflow-x-auto max-h-48 shadow-3xs">
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
            <div className="flex items-center justify-between bg-white border border-[#131311]/12 px-4 py-3.5 rounded-xl shadow-3xs">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
                className="bg-white border border-[#131311]/12 hover:bg-[#f3f2ea]/20 text-[#131311] font-mono text-[10px] font-bold py-1.5 px-3.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                &larr; PREVIOUS
              </button>
              
              <span className="font-mono text-xs text-[#575755]">
                Page <span className="font-bold text-[#131311]">{page + 1}</span> of <span className="font-bold text-[#131311]">{totalPages}</span> ({totalElements} total logs)
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                className="bg-white border border-[#131311]/12 hover:bg-[#f3f2ea]/20 text-[#131311] font-mono text-[10px] font-bold py-1.5 px-3.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                NEXT &rarr;
              </button>
            </div>
          )}
        </div>
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
