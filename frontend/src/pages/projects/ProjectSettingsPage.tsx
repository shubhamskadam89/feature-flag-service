import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, AlertTriangle, HelpCircle } from 'lucide-react';
import { getProjectByIdWithinOrganization, updateProject, deleteProject } from '../../services/projectService';
import { type Project } from '../../types';

export const ProjectSettingsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getProjectByIdWithinOrganization(projectId);
      if (response.data) {
        setProject(response.data);
        setProjectName(response.data.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    fetchProjectDetails();
  }, [projectId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !projectName.trim()) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await updateProject(projectId, projectName);
      if (response.data) {
        setProject(response.data);
        setProjectName(response.data.name);
        setSuccess('Project settings updated successfully.');
        // Dispatch event to trigger breadcrumb context update in Layout
        window.dispatchEvent(new Event('projectChanged'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!projectId) return;
    setIsArchiving(true);
    setError(null);
    try {
      await deleteProject(projectId);
      setShowConfirmArchive(false);
      
      // Clear active project context from localStorage
      localStorage.removeItem('activeProjectId');
      localStorage.removeItem('activeProjectName');
      
      // Dispatch events to let layout know project is gone
      window.dispatchEvent(new Event('projectChanged'));
      
      // Navigate to projects list page
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive project.');
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="font-mono text-xs text-[#8d8d8a] animate-pulse">LOADING SETTINGS...</div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="border border-red-200 bg-red-50/10 p-12 flex flex-col items-center justify-center min-h-[260px] text-center rounded-xl max-w-2xl">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
        <span className="font-mono text-xs uppercase tracking-wider mb-1.5 text-red-700 font-bold">Failed to load project settings</span>
        <p className="text-xs text-red-600 max-w-xs leading-relaxed mb-5 font-sans">
          {error}
        </p>
        <button
          onClick={fetchProjectDetails}
          className="bg-white border border-red-200 text-red-700 hover:bg-red-50 font-mono text-[9px] font-bold py-2 px-3.5 rounded-md transition-all shadow-3xs cursor-pointer"
        >
          RETRY FETCH
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="border-b border-[#131311]/5 pb-5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Settings className="w-4 h-4 text-[#8d8d8a]" />
          <span className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-widest">
            Settings: {project?.name || '—'}
          </span>
        </div>
        <h2 className="font-display font-black text-2xl text-[#131311] uppercase tracking-tight">
          PROJECT SETTINGS
        </h2>
        <p className="text-xs text-[#8d8d8a] mt-0.5">Manage configuration parameters, names, and life cycles.</p>
      </div>

      {/* Main Alert Banners */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-500 font-mono text-xs flex justify-between items-start rounded-lg shadow-3xs">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="hover:text-black font-bold">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-[#f6fbf4] border border-[#d2edd0] text-emerald-600 font-mono text-xs flex justify-between items-start rounded-lg shadow-3xs">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="hover:text-black font-bold">✕</button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-[#131311]/8 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#131311]/6 bg-[#f3f2ea]/40 font-mono text-[10px] font-bold text-[#8d8d8a] tracking-wider uppercase">
          General Settings
        </div>
        <form onSubmit={handleUpdate} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Project Name</label>
            <input
              required
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving || !projectName.trim() || projectName === project?.name}
              className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50 disabled:hover:bg-[#131311] cursor-pointer"
            >
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone Card */}
      <div className="bg-white border border-red-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-red-100 bg-red-50/50 font-mono text-[10px] font-bold text-red-500 tracking-wider uppercase flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-mono font-bold text-[#131311] uppercase">Archive Project</h4>
            <p className="text-xs text-[#8d8d8a] leading-relaxed max-w-xl">
              Archiving this project marks it as deleted. It will prevent any new evaluation keys, feature flags, or environment configurations from being requested. This action is reversible only by organization admins.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowConfirmArchive(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold cursor-pointer"
            >
              ARCHIVE PROJECT
            </button>
          </div>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showConfirmArchive && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-red-100 bg-red-50 text-red-500 flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-red-500 uppercase tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> CONFIRM ARCHIVE
              </h2>
              <button onClick={() => setShowConfirmArchive(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                Are you absolutely sure you want to archive project <strong className="text-[#131311]">{project?.name}</strong>?
                This will soft-delete the project and redirect you to the main dashboard.
              </p>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmArchive(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755]"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isArchiving ? 'ARCHIVING...' : 'YES, ARCHIVE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-4 pt-5 border-t border-[#131311]/8 flex items-start gap-3.5 text-xs text-[#8d8d8a] leading-relaxed">
        <HelpCircle className="w-4.5 h-4.5 text-[#131311]/20 shrink-0" />
        <div>
          <h4 className="font-mono font-bold text-[#131311] uppercase mb-0.5 text-[11px]">Audit Event Generation</h4>
          <p className="max-w-xl font-sans">
            Updating the name or archiving a project registers a immutable entry in the organization's system audit log, attributing the modification to your user profile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsPage;
