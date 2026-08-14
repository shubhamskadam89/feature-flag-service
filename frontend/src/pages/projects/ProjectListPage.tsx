import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Folder,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { getProjects, createProject, updateProject, deleteProject } from '../../services/projectService';
import { getOrganizations } from '../../services/organizationService';
import { type Project } from '../../types';

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Organization Context Role
  const [currentOrgRole, setCurrentOrgRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  // Modals & Forms State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [projectName, setProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjectsAndRole = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeOrgId = localStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        setProjects([]);
        return;
      }

      // Fetch role context
      const orgsResponse = await getOrganizations();
      const currentOrg = orgsResponse.data.find(org => org.id === activeOrgId);
      if (currentOrg) {
        setCurrentOrgRole(currentOrg.role);
      }

      // Fetch projects
      const response = await getProjects();
      setProjects(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchProjectsAndRole();

    // Listen to org switches from layout
    window.addEventListener('orgChanged', fetchProjectsAndRole);
    return () => window.removeEventListener('orgChanged', fetchProjectsAndRole);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createProject(projectName);
      setProjectName('');
      setIsCreateOpen(false);
      fetchProjectsAndRole();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !projectName.trim() || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateProject(selectedProject.id, projectName);
      setProjectName('');
      setIsEditOpen(false);
      fetchProjectsAndRole();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject || currentOrgRole !== 'ADMIN') return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteProject(selectedProject.id);
      setIsDeleteOpen(false);
      fetchProjectsAndRole();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter projects by search query
  const filteredProjects = projects.filter(proj => 
    proj.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#131311]/5 pb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#131311]/40"></div>
            <span className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-widest">Active Workspace</span>
          </div>
          <h2 className="font-display font-black text-2xl text-[#131311] uppercase tracking-tight">
            PROJECTS
          </h2>
          <p className="text-xs text-[#8d8d8a] mt-0.5">Manage your service feature configurations.</p>
        </div>

        {currentOrgRole === 'ADMIN' ? (
          <button
            onClick={() => {
              setProjectName('');
              setIsCreateOpen(true);
            }}
            className="bg-[#131311] hover:bg-black text-[#fffdf6] font-mono text-[11px] font-bold py-2 px-3.5 flex items-center justify-center gap-1.5 rounded-md hover:opacity-95 transition-opacity cursor-pointer shadow-sm border border-[#131311]"
          >
            <Plus className="w-3.5 h-3.5" /> CREATE PROJECT
          </button>
        ) : (
          <div className="relative group">
            <button
              disabled
              className="bg-[#131311]/5 text-[#8d8d8a] font-mono text-[11px] font-bold py-2 px-3.5 flex items-center justify-center gap-1.5 border border-[#131311]/5 rounded-md cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" /> CREATE PROJECT
            </button>
            <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block bg-[#f3f2ea] border border-[#131311]/12 text-[#575755] font-mono text-[8px] px-2 py-0.5 rounded shadow-xs z-50 whitespace-nowrap">
              ADMIN ROLE REQUIRED
            </div>
          </div>
        )}
      </div>

      {/* Global Errors */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-500 font-mono text-xs flex justify-between items-start rounded-lg shadow-2xs">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="hover:text-black">✕</button>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="bg-white border border-[#131311]/12 p-1 flex max-w-sm w-full rounded-md shadow-3xs">
        <div className="relative flex-1 flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#8d8d8a]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-[#131311] font-mono text-xs pl-8 focus:ring-0 focus:outline-none placeholder-[#8d8d8a]/40"
          />
        </div>
      </div>

      {/* Main Grid, Loader, Error, or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-[#131311]/6 p-6 h-48 flex flex-col justify-between animate-pulse rounded-xl">
              <div className="w-16 h-5 bg-[#f3f2ea] rounded"></div>
              <div className="space-y-2 mt-4">
                <div className="w-2/3 h-6 bg-[#f3f2ea] rounded"></div>
                <div className="w-1/2 h-3.5 bg-[#f3f2ea] rounded"></div>
              </div>
              <div className="w-full h-8 bg-[#f3f2ea]/40 rounded mt-5"></div>
            </div>
          ))}
        </div>
      ) : error && projects.length === 0 ? (
        /* Error Retry State */
        <div className="border border-red-200 bg-red-50/10 p-12 flex flex-col items-center justify-center min-h-[260px] text-[#8d8d8a] text-center rounded-xl">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
          <span className="font-mono text-xs uppercase tracking-wider mb-1.5 text-red-700 font-bold">Failed to load projects</span>
          <p className="text-xs text-red-600 max-w-xs leading-relaxed mb-5 font-sans">
            {error}
          </p>
          <button
            onClick={fetchProjectsAndRole}
            className="bg-white border border-red-200 text-red-700 hover:bg-red-50 font-mono text-[9px] font-bold py-2 px-3.5 rounded-md transition-all shadow-3xs cursor-pointer"
          >
            RETRY FETCH
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty State */
        <div className="border border-dashed border-[#131311]/12 bg-[#f3f2ea]/10 p-12 flex flex-col items-center justify-center min-h-[260px] text-[#8d8d8a] text-center rounded-xl">
          <Folder className="w-10 h-10 text-[#131311]/15 mb-3" />
          <span className="font-mono text-xs uppercase tracking-wider mb-1.5 text-[#131311] font-bold">No Projects Configured</span>
          <p className="text-xs max-w-xs leading-relaxed mb-5 font-sans">
            Projects hold independent deployment environments, feature flags, audit histories, and target rules.
          </p>
          {currentOrgRole === 'ADMIN' && (
            <button
              onClick={() => {
                setProjectName('');
                setIsCreateOpen(true);
              }}
              className="bg-white border border-[#131311]/12 text-[#131311] hover:bg-[#131311] hover:text-[#fffdf6] font-mono text-[9px] font-bold py-2 px-3 rounded-md transition-all shadow-3xs cursor-pointer"
            >
              + ADD NEW PROJECT
            </button>
          )}
        </div>
      ) : (
        /* Project Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const shortKey = `PROJ-${project.name.substring(0, 3).toUpperCase()}`;
            return (
              <div
                key={project.id}
                className="group bg-white border border-[#131311]/8 hover:border-[#131311]/20 p-6 flex flex-col gap-4 relative transition-all duration-200 rounded-xl shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="font-mono text-[9px] text-[#575755] border border-[#131311]/6 px-2 py-0.5 rounded bg-[#f3f2ea] font-semibold">
                    {shortKey}
                  </div>

                  {currentOrgRole === 'ADMIN' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setProjectName(project.name);
                          setIsEditOpen(true);
                        }}
                        className="text-[#8d8d8a] hover:text-[#131311] transition-colors"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                          setIsDeleteOpen(true);
                        }}
                        className="text-[#8d8d8a] hover:text-[#ff4d4d] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-[#131311] tracking-tight uppercase group-hover:text-black transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-[#8d8d8a] mt-0.5 font-sans leading-relaxed">
                    Active configuration namespace
                  </p>
                </div>

                <div className="font-mono text-[9px] text-[#8d8d8a] font-semibold mt-auto pt-3 border-t border-[#131311]/5 flex items-center justify-between">
                  <span>{project.featureCount || 0} FLAGS · {project.environmentCount || 0} ENVS</span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      localStorage.setItem('activeProjectId', project.id);
                      localStorage.setItem('activeProjectName', project.name);
                      navigate(`/projects/${project.id}/flags`);
                    }}
                    className="w-full flex justify-between items-center bg-[#fffdf6] border border-[#131311]/12 hover:border-[#131311]/25 hover:bg-[#131311]/3 text-[#575755] hover:text-[#131311] font-mono text-[9px] py-1.8 px-3 rounded-md transition-all"
                  >
                    <span>OPEN PROJECT</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform text-[#131311]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Blueprint Info Box */}
      <div className="mt-6 pt-5 border-t border-[#131311]/8 flex items-start gap-3.5 text-xs text-[#8d8d8a] leading-relaxed">
        <HelpCircle className="w-4.5 h-4.5 text-[#131311]/20 shrink-0" />
        <div>
          <h4 className="font-mono font-bold text-[#131311] uppercase mb-0.5 text-[11px]">Project Isolation</h4>
          <p className="max-w-xl font-sans">
            Each project functions as an independent sandbox. Flag configurations, custom target rule schemas, and evaluation keys inside a project are kept strictly isolated.
          </p>
        </div>
      </div>

      {/* Modals Layer */}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">CREATE NEW PROJECT</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Project Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Core Checkout"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
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
                  disabled={isSubmitting}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">RENAME PROJECT</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">New Project Name</label>
                <input
                  required
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
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
                  disabled={isSubmitting}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-red-100 bg-red-50 text-red-500 flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-red-500 uppercase tracking-tight">DELETE PROJECT</h2>
              <button onClick={() => setIsDeleteOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                Are you sure you want to delete project <strong className="text-[#131311]">{selectedProject?.name}</strong>?
                This action will mark the project as deleted and hide it from all views.
              </p>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755]"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'DELETING...' : 'DELETE PERMANENTLY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectListPage;
