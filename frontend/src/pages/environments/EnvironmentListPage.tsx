import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  AlertTriangle, 
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { 
  getEnvironments, 
  createEnvironment, 
  updateEnvironment, 
  deleteEnvironment, 
  rotateApiKey 
} from '../../services/environmentService';
import { getProjectByIdWithinOrganization } from '../../services/projectService';
import { getOrganizations } from '../../services/organizationService';
import { type Project, type Environment } from '../../types';

export const EnvironmentListPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auth context
  const [currentOrgRole, setCurrentOrgRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  // Modals visibility
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRotateOpen, setIsRotateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRevealOpen, setIsRevealOpen] = useState(false);

  // Form inputs
  const [envName, setEnvName] = useState('');
  const [editEnvName, setEditEnvName] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);

  // Reveal properties (one-time raw keys)
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [revealEnvName, setRevealEnvName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchProjectAndEnvironments = async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch organization role context
      const activeOrgId = localStorage.getItem('activeOrgId');
      if (activeOrgId) {
        const orgsResponse = await getOrganizations();
        const currentOrg = orgsResponse.data.find(org => org.id === activeOrgId);
        if (currentOrg) {
          setCurrentOrgRole(currentOrg.role);
        }
      }

      // 2. Fetch project context details
      const projectResponse = await getProjectByIdWithinOrganization(projectId);
      if (projectResponse.data) {
        setProject(projectResponse.data);
      }

      // 3. Fetch environments
      const envsResponse = await getEnvironments(projectId);
      setEnvironments(envsResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch environment settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    fetchProjectAndEnvironments();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !envName.trim() || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await createEnvironment(projectId, envName);
      if (response.data) {
        setRevealKey(response.data.plaintextApiKey);
        setRevealEnvName(response.data.name);
        setEnvName('');
        setIsCreateOpen(false);
        setIsRevealOpen(true);
        // Refresh listing
        await fetchProjectAndEnvironments();
        window.dispatchEvent(new Event('envListChanged'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create environment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedEnv || !editEnvName.trim() || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateEnvironment(projectId, selectedEnv.id, editEnvName);
      setEditEnvName('');
      setSelectedEnv(null);
      setIsEditOpen(false);
      await fetchProjectAndEnvironments();
      window.dispatchEvent(new Event('envListChanged'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename environment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRotate = async () => {
    if (!projectId || !selectedEnv || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await rotateApiKey(projectId, selectedEnv.id);
      if (response.data) {
        setRevealKey(response.data.plaintextApiKey);
        setRevealEnvName(response.data.name);
        setSelectedEnv(null);
        setIsRotateOpen(false);
        setIsRevealOpen(true);
        await fetchProjectAndEnvironments();
        window.dispatchEvent(new Event('envListChanged'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate API key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !selectedEnv || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteEnvironment(projectId, selectedEnv.id);
      setSelectedEnv(null);
      setIsDeleteOpen(false);
      await fetchProjectAndEnvironments();
      window.dispatchEvent(new Event('envListChanged'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive environment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!revealKey) return;
    navigator.clipboard.writeText(revealKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[250px]">
        <div className="font-mono text-xs text-[#8d8d8a] animate-pulse">LOADING ENVIRONMENTS...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-[#131311]/5 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-[#8d8d8a] hover:text-[#131311] transition-colors flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <span className="text-[#131311]/20 font-sans text-xs">/</span>
            <span className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-widest">
              Project: {project?.name || '—'}
            </span>
          </div>
          <h2 className="font-display font-black text-2xl text-[#131311] uppercase tracking-tight">
            ENVIRONMENTS
          </h2>
          <p className="text-xs text-[#8d8d8a] mt-0.5">Configure keys, namespaces, and target evaluation boundaries.</p>
        </div>

        {currentOrgRole === 'ADMIN' && (
          <button
            onClick={() => {
              setEnvName('');
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1 bg-[#131311] hover:bg-black text-[#fffdf6] font-mono text-[10px] font-bold py-2.5 px-4 rounded-md transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> CREATE ENVIRONMENT
          </button>
        )}
      </div>

      {/* Main Alert Banners */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-500 font-mono text-xs flex justify-between items-start rounded-lg shadow-3xs">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="hover:text-black font-bold">✕</button>
        </div>
      )}

      {/* Empty State */}
      {environments.length === 0 ? (
        <div className="border border-dashed border-[#131311]/12 bg-[#f3f2ea]/10 p-12 flex flex-col items-center justify-center min-h-[260px] text-[#8d8d8a] text-center rounded-xl">
          <Layers className="w-10 h-10 text-[#131311]/15 mb-3" />
          <span className="font-mono text-xs uppercase tracking-wider mb-1.5 text-[#131311] font-bold">No Environments Registered</span>
          <p className="text-xs max-w-xs leading-relaxed mb-5 font-sans">
            Register namespaces (e.g. Development, Production) to obtain client SDK API keys.
          </p>
          {currentOrgRole === 'ADMIN' && (
            <button
              onClick={() => {
                setEnvName('');
                setIsCreateOpen(true);
              }}
              className="bg-white border border-[#131311]/12 text-[#131311] hover:bg-[#131311] hover:text-[#fffdf6] font-mono text-[9px] font-bold py-2 px-3 rounded-md transition-all shadow-3xs"
            >
              + ADD ENVIRONMENT
            </button>
          )}
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {environments.map((env) => (
            <div
              key={env.id}
              className="group bg-white border border-[#131311]/8 p-5 flex flex-col gap-4 rounded-xl shadow-2xs relative"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">
                    {env.name}
                  </h3>
                  <p className="text-[10px] text-[#8d8d8a] font-mono mt-0.5 uppercase">
                    ID: {env.id.substring(0, 8)}...
                  </p>
                </div>

                {currentOrgRole === 'ADMIN' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedEnv(env);
                        setEditEnvName(env.name);
                        setIsEditOpen(true);
                      }}
                      className="text-[#8d8d8a] hover:text-[#131311] transition-colors p-1 hover:bg-[#f3f2ea] rounded"
                      title="Rename Environment"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEnv(env);
                        setIsDeleteOpen(true);
                      }}
                      className="text-[#8d8d8a] hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                      title="Archive Environment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* API Key Box */}
              <div className="bg-[#f3f2ea]/40 border border-[#131311]/6 rounded-lg p-3.5 flex flex-col gap-1.5">
                <span className="font-mono text-[8px] text-[#8d8d8a] uppercase tracking-wider font-bold">SDK CLIENT API KEY</span>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-[#575755] select-all">
                    {env.apiKeyPrefix}••••••••••••••••••••••••
                  </span>
                  
                  {currentOrgRole === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setSelectedEnv(env);
                        setIsRotateOpen(true);
                      }}
                      className="flex items-center gap-1 font-mono text-[8px] font-bold text-[#131311]/60 hover:text-[#131311] transition-colors uppercase border border-[#131311]/10 bg-white hover:bg-[#fffdf6] px-2 py-1 rounded"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Rotate Key
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-auto font-mono text-[8px] text-[#8d8d8a] pt-3 border-t border-[#131311]/5 flex justify-between items-center">
                <span>CREATED {new Date(env.createdAt).toLocaleDateString()}</span>
                <span>UPDATED {new Date(env.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info helper footer */}
      <div className="mt-6 pt-5 border-t border-[#131311]/8 flex items-start gap-3.5 text-xs text-[#8d8d8a] leading-relaxed">
        <HelpCircle className="w-4.5 h-4.5 text-[#131311]/20 shrink-0" />
        <div>
          <h4 className="font-mono font-bold text-[#131311] uppercase mb-0.5 text-[11px]">Edge Configuration Keys</h4>
          <p className="max-w-xl font-sans">
            Environments function as distinct execution regions. Connect your server SDKs using these keys to query runtime evaluations safely.
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* Modals Layer */}
      
      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">CREATE ENVIRONMENT</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Environment Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Production"
                  value={envName}
                  onChange={(e) => setEnvName(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !envName.trim()}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">RENAME ENVIRONMENT</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">New Environment Name</label>
                <input
                  required
                  type="text"
                  value={editEnvName}
                  onChange={(e) => setEditEnvName(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editEnvName.trim() || editEnvName === selectedEnv?.name}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'RENAME...' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rotate Key Confirmation Modal */}
      {isRotateOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-red-100 bg-red-50 text-red-500 flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-red-500 uppercase tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> ROTATE API KEY?
              </h2>
              <button onClick={() => setIsRotateOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                The current API key for <strong className="text-[#131311]">{selectedEnv?.name}</strong> will immediately become invalid.
              </p>
              <p className="text-xs text-[#8d8d8a] leading-relaxed font-bold">
                ⚠️ Any application using the current key will lose access after rotation.
              </p>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRotateOpen(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755]"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  disabled={isSubmitting}
                  className="bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'ROTATING...' : 'ROTATE KEY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Archive Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-red-100 bg-red-50 text-red-500 flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-red-500 uppercase tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> ARCHIVE ENVIRONMENT?
              </h2>
              <button onClick={() => setIsDeleteOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                Are you sure you want to archive environment <strong className="text-[#131311]">{selectedEnv?.name}</strong>?
              </p>
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                This environment will no longer be available for normal management or evaluation.
              </p>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755]"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'ARCHIVING...' : 'ARCHIVE ENVIRONMENT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reveal Plaintext Key Modal (One-Time Reveal) */}
      {isRevealOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-md w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight flex items-center gap-1.5">
                ✓ ENVIRONMENT API KEY
              </h2>
              <button 
                onClick={() => {
                  setRevealKey(null);
                  setRevealEnvName(null);
                  setIsRevealOpen(false);
                }} 
                className="text-[#8d8d8a] hover:text-[#131311]"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex flex-col gap-1">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider">⚠️ SECURITY WARNING</span>
                <span className="text-[10px] leading-relaxed">
                  Your API key will only be shown once. Save this key now. It cannot be recovered later.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">
                  Secret API Key ({revealEnvName})
                </label>
                <div className="flex items-center gap-2 bg-[#fffdf6] border border-[#131311]/12 p-3 rounded-md">
                  <code className="flex-grow font-mono text-xs text-[#131311] break-all select-all">
                    {revealKey}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 border border-[#131311]/12 hover:bg-[#f3f2ea] rounded transition-colors text-[#575755] hover:text-[#131311]"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRevealKey(null);
                    setRevealEnvName(null);
                    setIsRevealOpen(false);
                  }}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-6 py-2.5 rounded-md transition-all text-xs font-mono font-bold cursor-pointer"
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentListPage;
