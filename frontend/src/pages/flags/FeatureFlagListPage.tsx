import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Flag, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  HelpCircle,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { 
  getFeatures, 
  createFeature, 
  updateFeature, 
  deleteFeature, 
  getFeatureStates, 
  toggleFeatureState 
} from '../../services/featureService';
import { getProjectByIdWithinOrganization } from '../../services/projectService';
import { getOrganizations } from '../../services/organizationService';
import { type Project, type Feature } from '../../types';

export const FeatureFlagListPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [featureStatesMap, setFeatureStatesMap] = useState<Record<string, boolean>>({});
  const [isPendingMap, setIsPendingMap] = useState<Record<string, boolean>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  // Environment and user context
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [activeEnvName, setActiveEnvName] = useState<string | null>(null);
  const [currentOrgRole, setCurrentOrgRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  // Modals Visibility
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Fields
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [flagKey, setFlagKey] = useState('');
  const [flagName, setFlagName] = useState('');
  const [flagDescription, setFlagDescription] = useState('');
  
  // Local Validation Error
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchEnvContext = () => {
    const envId = localStorage.getItem('activeEnvironmentId');
    const envName = localStorage.getItem('activeEnvironmentName');
    setActiveEnvId(envId);
    setActiveEnvName(envName);
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchEnvContext();
    window.addEventListener('envChanged', fetchEnvContext);
    return () => window.removeEventListener('envChanged', fetchEnvContext);
  }, []);

  const loadData = async () => {
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

      // 3. Fetch project features
      const featuresResponse = await getFeatures(projectId);
      const fetchedFeatures = featuresResponse.data || [];
      setFeatures(fetchedFeatures);

      // 4. Fetch environment feature states if environment is active
      const envId = localStorage.getItem('activeEnvironmentId');
      if (envId) {
        const statesResponse = await getFeatureStates(envId);
        const fetchedStates = statesResponse.data || [];
        const stateMap: Record<string, boolean> = {};
        fetchedFeatures.forEach(f => {
          const match = fetchedStates.find(s => s.featureId === f.id);
          stateMap[f.id] = match ? match.enabled : false;
        });
        setFeatureStatesMap(stateMap);
      } else {
        setFeatureStatesMap({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flag list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    loadData();
  }, [projectId, activeEnvId]);

  const handleToggle = async (feature: Feature) => {
    if (!activeEnvId || currentOrgRole !== 'ADMIN') return;
    const featureId = feature.id;
    const currentVal = !!featureStatesMap[featureId];
    const newVal = !currentVal;

    // Set pending spinner state
    setIsPendingMap(prev => ({ ...prev, [featureId]: true }));
    setError(null);

    try {
      await toggleFeatureState(activeEnvId, feature.key, newVal);
      setFeatureStatesMap(prev => ({ ...prev, [featureId]: newVal }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Permission denied or network error.';
      setError(`Failed to update toggle: ${errorMsg}`);
      // Rollback: Keep toggle at currentVal
      setFeatureStatesMap(prev => ({ ...prev, [featureId]: currentVal }));
    } finally {
      setIsPendingMap(prev => ({ ...prev, [featureId]: false }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!projectId || currentOrgRole !== 'ADMIN') return;

    // Key Validation Regex
    const keyRegex = /^[a-z0-9_.-]+$/;
    if (!keyRegex.test(flagKey)) {
      setValidationError('Key must contain only lowercase letters, numbers, underscores, dots, or hyphens.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createFeature(projectId, flagKey, flagName, flagDescription);
      setIsCreateOpen(false);
      setFlagKey('');
      setFlagName('');
      setFlagDescription('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create feature.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedFeature || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateFeature(projectId, selectedFeature.id, flagName, flagDescription);
      setIsEditOpen(false);
      setFlagName('');
      setFlagDescription('');
      setSelectedFeature(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature metadata.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !selectedFeature || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteFeature(projectId, selectedFeature.id);
      setIsDeleteOpen(false);
      setSelectedFeature(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feature.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFeatures = features.filter(f => 
    f.key.toLowerCase().includes(searchText.toLowerCase()) ||
    f.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[250px]">
        <div className="font-mono text-xs text-[#8d8d8a] animate-pulse">LOADING CONFIGURATIONS...</div>
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
          
          <div className="flex items-center gap-2.5">
            <h2 className="font-display font-black text-2xl text-[#131311] uppercase tracking-tight">
              FEATURE FLAGS
            </h2>
            {activeEnvName && (
              <span className="font-mono text-[9px] bg-[#131311]/5 border border-[#131311]/10 px-2 py-0.5 rounded text-[#575755] uppercase font-bold tracking-wider">
                Environment: {activeEnvName}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8d8d8a] mt-0.5">Manage runtime config toggles and decoupling parameters.</p>
        </div>

        {currentOrgRole === 'ADMIN' && (
          <button
            onClick={() => {
              setFlagKey('');
              setFlagName('');
              setFlagDescription('');
              setValidationError(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1 bg-[#131311] hover:bg-black text-[#fffdf6] font-mono text-[10px] font-bold py-2.5 px-4 rounded-md transition-all self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> CREATE FLAG
          </button>
        )}
      </div>

      {/* Alert Banner */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-500 font-mono text-xs flex justify-between items-start rounded-lg shadow-3xs">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="hover:text-black font-bold">✕</button>
        </div>
      )}

      {/* Workspace Search & Filter */}
      {features.length > 0 && (
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#8d8d8a]" />
          </span>
          <input
            type="text"
            placeholder="Search flags by name, key..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-white border border-[#131311]/12 text-[#131311] font-mono text-xs pl-9 pr-4 py-2 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none placeholder-[#8d8d8a]"
          />
        </div>
      )}

      {/* Empty State */}
      {features.length === 0 ? (
        <div className="border border-dashed border-[#131311]/12 bg-[#f3f2ea]/10 p-12 flex flex-col items-center justify-center min-h-[260px] text-[#8d8d8a] text-center rounded-xl">
          <Flag className="w-10 h-10 text-[#131311]/15 mb-3" />
          <span className="font-mono text-xs uppercase tracking-wider mb-1.5 text-[#131311] font-bold">No Flags Registered</span>
          <p className="text-xs max-w-xs leading-relaxed mb-5 font-sans">
            Define features at project level and control values context-selectively per environment.
          </p>
          {currentOrgRole === 'ADMIN' && (
            <button
              onClick={() => {
                setFlagKey('');
                setFlagName('');
                setFlagDescription('');
                setValidationError(null);
                setIsCreateOpen(true);
              }}
              className="bg-white border border-[#131311]/12 text-[#131311] hover:bg-[#131311] hover:text-[#fffdf6] font-mono text-[9px] font-bold py-2 px-3 rounded-md transition-all shadow-3xs"
            >
              + ADD FEATURE FLAG
            </button>
          )}
        </div>
      ) : filteredFeatures.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#8d8d8a] font-mono border border-dashed border-[#131311]/12 bg-[#f3f2ea]/10 rounded-xl">
          No matches found for "{searchText}"
        </div>
      ) : (
        /* Feature Grid list */
        <div className="flex flex-col gap-4">
          {filteredFeatures.map((flag) => {
            const isEnabled = !!featureStatesMap[flag.id];
            const isPending = !!isPendingMap[flag.id];
            
            return (
              <div
                key={flag.id}
                className="bg-white border border-[#131311]/8 hover:border-[#131311]/15 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-sm text-[#131311] tracking-tight">
                      {flag.name}
                    </span>
                    <span className="font-mono text-[8px] bg-[#131311]/5 border border-[#131311]/10 px-1.5 py-0.5 rounded text-[#8d8d8a] font-bold uppercase tracking-wider">
                      {flag.type}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#575755] select-all">
                    {flag.key}
                  </div>
                  {flag.description && (
                    <p className="text-xs text-[#8d8d8a] font-sans max-w-xl">
                      {flag.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-[#131311]/5 pt-4 sm:pt-0 shrink-0">
                  {/* Status Toggle control */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${isEnabled ? 'text-emerald-600' : 'text-[#8d8d8a]'}`}>
                        {isPending ? 'UPDATING...' : isEnabled ? '● ACTIVE' : '○ OFF'}
                      </span>
                    </div>

                    <label className={`relative inline-flex items-center ${currentOrgRole === 'ADMIN' ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        disabled={isPending || currentOrgRole !== 'ADMIN' || !activeEnvId}
                        onChange={() => handleToggle(flag)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#e4e4e0] border border-[#131311]/12 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c6fd50] peer-checked:border-[#131311]/20"></div>
                    </label>
                  </div>

                  {currentOrgRole === 'ADMIN' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedFeature(flag);
                          setFlagName(flag.name);
                          setFlagDescription(flag.description || '');
                          setIsEditOpen(true);
                        }}
                        className="text-[#8d8d8a] hover:text-[#131311] transition-colors p-1.5 hover:bg-[#f3f2ea] rounded"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFeature(flag);
                          setIsDeleteOpen(true);
                        }}
                        className="text-[#8d8d8a] hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
                        title="Archive Flag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Helper Footer */}
      <div className="mt-6 pt-5 border-t border-[#131311]/8 flex items-start gap-3.5 text-xs text-[#8d8d8a] leading-relaxed">
        <HelpCircle className="w-4.5 h-4.5 text-[#131311]/20 shrink-0" />
        <div>
          <h4 className="font-mono font-bold text-[#131311] uppercase mb-0.5 text-[11px]">Flag Segment Evaluation</h4>
          <p className="max-w-xl font-sans">
            Toggles are environment-scoped. Switching environments via the topbar switcher updates shown flag values immediately.
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* Modals Layer */}

      {/* Create Flag Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">CREATE FEATURE FLAG</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-500 font-mono text-[10px] rounded">
                  ⚠️ {validationError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Flag Key (Slug ID)</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. checkout-redesign"
                  value={flagKey}
                  onChange={(e) => setFlagKey(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Flag Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Checkout Redesign"
                  value={flagName}
                  onChange={(e) => setFlagName(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Explain what this flag toggles..."
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none min-h-[70px] resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Flag Type</label>
                <div className="w-full bg-[#f3f2ea] border border-[#131311]/8 text-[#575755] font-mono text-xs px-3 py-2.5 rounded-md select-none">
                  BOOLEAN (V1 Default)
                </div>
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
                  disabled={isSubmitting || !flagKey.trim() || !flagName.trim()}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Flag Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">EDIT FEATURE FLAG</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Flag Key (Read-Only)</label>
                <div className="w-full bg-[#f3f2ea] border border-[#131311]/8 text-[#8d8d8a] font-mono text-xs px-3 py-2.5 rounded-md select-all">
                  {selectedFeature?.key}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Flag Name</label>
                <input
                  required
                  type="text"
                  value={flagName}
                  onChange={(e) => setFlagName(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Description</label>
                <textarea
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none min-h-[70px] resize-none"
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
                  disabled={isSubmitting || !flagName.trim() || (flagName === selectedFeature?.name && flagDescription === selectedFeature?.description)}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Archive Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-red-100 bg-red-50 text-red-500 flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-red-500 uppercase tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> ARCHIVE FEATURE FLAG?
              </h2>
              <button onClick={() => setIsDeleteOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                Are you sure you want to delete flag <strong className="text-[#131311]">"{selectedFeature?.key}"</strong>?
              </p>
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                This will archive the feature and remove it from the active feature list.
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
                  {isSubmitting ? 'ARCHIVING...' : 'ARCHIVE FEATURE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureFlagListPage;
