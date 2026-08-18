import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Grid,
  Flag,
  Layers,
  Settings,
  History,
  HelpCircle,
  BookOpen,
  ChevronDown,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../services/organizationService';
import { getProjects } from '../services/projectService';
import { getEnvironments } from '../services/environmentService';
import { type Organization, type Project, type Environment } from '../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: 'projects' | 'flags' | 'environments' | 'settings' | 'audit';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab }) => {
  const navigate = useNavigate();

  const [user] = useState<{ name: string; email: string }>(() => {
    const savedUserStr = localStorage.getItem('user');
    if (savedUserStr) {
      try {
        return JSON.parse(savedUserStr);
      } catch {
        return { name: 'Developer User', email: 'dev@flags.dev' };
      }
    }
    return { name: 'Developer User', email: 'dev@flags.dev' };
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  // Project Switcher States
  const { projectId } = useParams<{ projectId?: string }>();
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Environment Switcher States
  const [environmentsList, setEnvironmentsList] = useState<Environment[]>([]);
  const [activeEnv, setActiveEnv] = useState<Environment | null>(null);
  const [isEnvDropdownOpen, setIsEnvDropdownOpen] = useState(false);
  const envDropdownRef = useRef<HTMLDivElement>(null);

  // Modals & UI States
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Organization Modals
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isDeleteOrgConfirmOpen, setIsDeleteOrgConfirmOpen] = useState(false);

  const [newOrgName, setNewOrgName] = useState('');
  const [editOrgName, setEditOrgName] = useState('');
  const [orgError, setOrgError] = useState<string | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(false);

  const orgDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (envDropdownRef.current && !envDropdownRef.current.contains(event.target as Node)) {
        setIsEnvDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      if (response.data) {
        setProjectsList(response.data);
        if (projectId) {
          const found = response.data.find(p => p.id === projectId);
          if (found) {
            setActiveProject(found);
            localStorage.setItem('activeProjectId', found.id);
            localStorage.setItem('activeProjectName', found.name);
          } else {
            setActiveProject(null);
          }
        } else {
          setActiveProject(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects in DashboardLayout', err);
    }
  };

  const fetchEnvironments = async (projId: string) => {
    try {
      const response = await getEnvironments(projId);
      if (response.data) {
        setEnvironmentsList(response.data);
        if (response.data.length > 0) {
          const storedEnvId = localStorage.getItem('activeEnvironmentId');
          const found = response.data.find(e => e.id === storedEnvId) || response.data[0];
          setActiveEnv(found);
          localStorage.setItem('activeEnvironmentId', found.id);
          localStorage.setItem('activeEnvironmentName', found.name);
        } else {
          setActiveEnv(null);
          localStorage.removeItem('activeEnvironmentId');
          localStorage.removeItem('activeEnvironmentName');
        }
        // Dispatch event to let child components know active environment updated
        window.dispatchEvent(new Event('envChanged'));
      }
    } catch (err) {
      console.error('Failed to load environments in DashboardLayout', err);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    fetchProjects();
    if (projectId) {
      fetchEnvironments(projectId);
    } else {
      setEnvironmentsList([]);
      setActiveEnv(null);
      localStorage.removeItem('activeEnvironmentId');
      localStorage.removeItem('activeEnvironmentName');
    }

    const handleRefreshEnvs = () => {
      if (projectId) fetchEnvironments(projectId);
    };

    window.addEventListener('orgChanged', fetchProjects);
    window.addEventListener('projectChanged', fetchProjects);
    window.addEventListener('envListChanged', handleRefreshEnvs);
    return () => {
      window.removeEventListener('orgChanged', fetchProjects);
      window.removeEventListener('projectChanged', fetchProjects);
      window.removeEventListener('envListChanged', handleRefreshEnvs);
    };
  }, [projectId]);

  const fetchOrgs = async (selectOrgId?: string) => {
    setIsOrgLoading(true);
    setOrgError(null);
    try {
      const response = await getOrganizations();
      if (response.data && response.data.length > 0) {
        setOrganizations(response.data);

        // Find selected organization
        const storedOrgId = selectOrgId || localStorage.getItem('activeOrgId');
        const found = response.data.find(org => org.id === storedOrgId) || response.data[0];

        setActiveOrg(found);
        localStorage.setItem('activeOrgId', found.id);

        // Dispatch custom event to notify nested components of org change
        window.dispatchEvent(new Event('orgChanged'));
      } else {
        setOrganizations([]);
        setActiveOrg(null);
        localStorage.removeItem('activeOrgId');
        setIsCreateOrgOpen(true);
      }
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : 'Failed to fetch organizations.');
    } finally {
      setIsOrgLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchOrgs();
  }, []);

  const handleOrgSwitch = (org: Organization) => {
    setActiveOrg(org);
    localStorage.setItem('activeOrgId', org.id);
    setIsOrgDropdownOpen(false);
    // Dispatch custom event to notify nested components
    window.dispatchEvent(new Event('orgChanged'));
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsOrgLoading(true);
    setOrgError(null);
    try {
      const response = await createOrganization(newOrgName);
      setNewOrgName('');
      setIsCreateOrgOpen(false);
      await fetchOrgs(response.data.id);
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : 'Failed to create organization.');
    } finally {
      setIsOrgLoading(false);
    }
  };

  const handleRenameOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !editOrgName.trim()) return;
    setIsOrgLoading(true);
    setOrgError(null);
    try {
      await updateOrganization(activeOrg.id, editOrgName);
      setEditOrgName('');
      setIsEditOrgOpen(false);
      await fetchOrgs(activeOrg.id);
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : 'Failed to rename organization.');
    } finally {
      setIsOrgLoading(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!activeOrg) return;
    setIsOrgLoading(true);
    setOrgError(null);
    try {
      await deleteOrganization(activeOrg.id);
      setIsDeleteOrgConfirmOpen(false);
      localStorage.removeItem('activeOrgId');
      await fetchOrgs();
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : 'Failed to delete organization.');
    } finally {
      setIsOrgLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeOrgId');
    navigate('/login');
  };

  const navItems = [
    { key: 'projects', label: 'Projects', icon: <Grid className="w-4 h-4" />, path: '/dashboard' },
    { key: 'flags', label: 'Feature Flags', icon: <Flag className="w-4 h-4" />, path: projectId ? `/projects/${projectId}/flags` : '/dashboard' },
    { key: 'environments', label: 'Environments', icon: <Layers className="w-4 h-4" />, path: projectId ? `/projects/${projectId}/environments` : '/dashboard' },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, path: projectId ? `/projects/${projectId}/settings` : '/dashboard' },
    { key: 'audit', label: 'Audit Logs', icon: <History className="w-4 h-4" />, path: projectId ? `/projects/${projectId}/audit-logs` : '/dashboard' },
  ];

  // Sidebar Component Contents
  const renderSidebarContents = () => (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Brand — Manus lime-dot pattern */}
      <div className="mb-9 flex justify-between items-center px-2">
        <a href="/" className="flex items-center gap-2.5">
          <span>
            <img src="/logo-light.png" alt="Logo" className="h-6" />
            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.17em] text-[var(--color-muted-text)]">release console</span>
          </span>
        </a>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden p-1.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-surface)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav List — Manus border-transparent→border-line active pattern */}
      <nav className="flex-grow flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          const isDisabled = item.key !== 'projects' && !projectId;
          return (
            <button
              key={item.key}
              disabled={isDisabled}
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate(item.path);
              }}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${isActive
                ? 'border-[var(--color-line)] bg-[var(--color-surface)] font-semibold text-[var(--color-foreground)] shadow-sm'
                : isDisabled
                  ? 'border-transparent text-[var(--color-muted-text)]/40 cursor-not-allowed'
                  : 'border-transparent text-[var(--color-secondary-text)] hover:border-[var(--color-line)] hover:bg-[var(--color-surface)]/50 hover:text-[var(--color-foreground)]'
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar footer — docs + user */}
      <div className="mt-auto space-y-3 border-t border-[var(--color-line)] pt-4">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
          <p className="font-mono text-[10px] font-semibold text-[var(--color-foreground)]">Release console</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-secondary-text)]">Connected to the flags.dev service.</p>
          <div className="mt-3 flex gap-2 font-mono text-[10px]">
            <a href="#" className="text-[var(--color-foreground)] underline decoration-[var(--color-lime)] decoration-2 underline-offset-4">
              <HelpCircle className="inline w-3 h-3 mr-1" />Support
            </a>
            <a href="#" className="ml-3 text-[var(--color-foreground)] underline decoration-[var(--color-lime)] decoration-2 underline-offset-4">
              <BookOpen className="inline w-3 h-3 mr-1" />Docs
            </a>
          </div>
        </div>
        {/* User row */}
        <div className="flex items-center gap-3 px-1">
          {/* Manus-style ink avatar */}
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-ink)] font-mono text-xs font-bold text-[var(--color-cream)]">
            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] font-semibold text-[var(--color-foreground)] truncate">{user?.name}</div>
            <div className="font-mono text-[9px] text-[var(--color-muted-text)] truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[var(--color-muted-text)] hover:text-[var(--color-destructive)] transition-colors p-1.5 rounded-lg border border-transparent hover:border-[var(--color-line)]"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="surface-cream min-h-screen text-[var(--color-foreground)] flex relative font-sans antialiased">
      {/* Subtle grid background — Manus pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.035] [background-image:linear-gradient(to_right,#131311_1px,transparent_1px),linear-gradient(to_bottom,#131311_1px,transparent_1px)] [background-size:34px_34px]" />

      {/* Mobile Drawer (Sidebar overlay on small viewports) */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        {/* Dark Backdrop */}
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/30 backdrop-blur-xs"
        />
        {/* Drawer content sheet */}
        <div className={`absolute top-0 bottom-0 left-0 w-60 bg-[var(--sand)] border-r border-[var(--color-line)] shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {renderSidebarContents()}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-60 z-30 bg-[var(--sand)] border-r border-[var(--color-line)]">
        {renderSidebarContents()}
      </aside>

      {/* Main Layout Area */}
      <div className="flex-grow flex flex-col md:ml-60 min-w-0 relative z-10 min-h-screen">
        {/* Header Topbar — Manus sticky backdrop-blur pattern */}
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-[var(--color-line)] bg-[var(--cream)]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-2 lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Context switch dropdowns — Manus topbar Project/Environment pattern */}
            <div className="hidden text-sm sm:block">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-text)]">Project</p>
              <p className="mt-0.5 font-display text-base leading-none">{activeProject?.name || 'Select project'}</p>
            </div>
            <span className="hidden h-8 w-px bg-[var(--color-line)] sm:block" />
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="relative" ref={orgDropdownRef}>
                <button
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-line-strong)] font-mono text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <span className="max-w-[100px] truncate">{activeOrg?.name || 'Loading...'}</span>
                  <ChevronDown className="w-3 h-3 text-[var(--color-muted-text)]" />
                </button>

                {/* Organization Switcher Dropdown */}
                {isOrgDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-60 bg-white border border-[#131311]/12 rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-2.5 border-b border-[#131311]/6 bg-[#f3f2ea] text-[9px] text-[#8d8d8a] font-bold tracking-wider uppercase font-mono">
                      Organizations
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 flex flex-col gap-0.5">
                      {organizations.map((org) => {
                        const isActive = org.id === activeOrg?.id;
                        return (
                          <button
                            key={org.id}
                            onClick={() => handleOrgSwitch(org)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${isActive ? 'text-[#131311] font-bold bg-[#131311]/4' : 'text-[#575755] hover:bg-[#131311]/3'
                              }`}
                          >
                            <span className="text-xs">{org.name}</span>
                            <span className="text-[8px] font-mono border border-[#131311]/10 px-1 py-0.2 rounded bg-white font-bold text-[#8d8d8a]">
                              {org.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-2 border-t border-[#131311]/6 bg-[#f3f2ea]/40 flex flex-col gap-1.5">
                      <button
                        onClick={() => {
                          setIsOrgDropdownOpen(false);
                          setOrgError(null);
                          setIsCreateOrgOpen(true);
                        }}
                        className="w-full py-1.5 bg-[#131311] text-[#fffdf6] font-mono text-[10px] font-bold text-center flex items-center justify-center gap-1 rounded-md hover:bg-black transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Create Org
                      </button>

                      {activeOrg?.role === 'ADMIN' && (
                        <div className="flex gap-1 pt-1 border-t border-[#131311]/5">
                          <button
                            onClick={() => {
                              setIsOrgDropdownOpen(false);
                              setOrgError(null);
                              setEditOrgName(activeOrg.name);
                              setIsEditOrgOpen(true);
                            }}
                            className="flex-1 py-1 bg-white border border-[#131311]/12 text-[#575755] hover:text-[#131311] rounded-md flex items-center justify-center gap-1 hover:bg-[#131311]/4 transition-all text-[9px] font-mono"
                          >
                            <Edit3 className="w-2.5 h-2.5" /> Rename
                          </button>
                          <button
                            onClick={() => {
                              setIsOrgDropdownOpen(false);
                              setOrgError(null);
                              setIsDeleteOrgConfirmOpen(true);
                            }}
                            className="flex-1 py-1 bg-red-50 border border-red-100 text-[#ff4d4d] rounded-md flex items-center justify-center gap-1 hover:bg-red-100/40 transition-all text-[9px] font-mono"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Project switcher */}
              <div className="relative" ref={projectDropdownRef}>
                <button
                  onClick={() => {
                    if (projectsList.length > 0) {
                      setIsProjectDropdownOpen(!isProjectDropdownOpen);
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-[var(--color-line-strong)] font-mono text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Switch Project"
                >
                  <span className="max-w-[120px] truncate">{activeProject?.name || '—'}</span>
                  <ChevronDown className="w-3 h-3 text-[var(--color-muted-text)]" />
                </button>

                {isProjectDropdownOpen && projectsList.length > 0 && (
                  <div className="absolute left-0 mt-1.5 w-60 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-2.5 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] label-mono">
                      Projects
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 flex flex-col gap-0.5">
                      {projectsList.map((p) => {
                        const isActive = p.id === activeProject?.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setIsProjectDropdownOpen(false);
                              const currentTab = activeTab === 'projects' ? 'flags' : activeTab;
                              navigate(`/projects/${p.id}/${currentTab}`);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${isActive ? 'font-semibold text-[var(--color-foreground)] bg-[var(--color-surface-subtle)]' : 'text-[var(--color-secondary-text)] hover:bg-[var(--color-surface-subtle)]'
                              }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Environment selector — Manus color-coded dot pattern */}
              {projectId && (
                <>
                  <div className="relative" ref={envDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        if (environmentsList.length > 0) {
                          setIsEnvDropdownOpen(!isEnvDropdownOpen);
                        }
                      }}
                      className="group flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 hover:border-[var(--color-line-strong)] transition-colors"
                      title="Choose environment"
                    >
                      {/* Color dot: red=Production, amber=Staging, green=others */}
                      <span className={`size-2 rounded-full ${activeEnv?.name?.toLowerCase().includes('prod') ? 'bg-[var(--color-conflict)]' :
                        activeEnv?.name?.toLowerCase().includes('stag') ? 'bg-[var(--color-caution)]' :
                          'bg-[var(--color-lime)]'
                        }`} />
                      <span className="font-mono text-[11px] font-semibold">{activeEnv?.name || '—'}</span>
                      <ChevronDown className="w-3 h-3 text-[var(--color-muted-text)]" />
                    </button>

                    {isEnvDropdownOpen && environmentsList.length > 0 && (
                      <div className="absolute left-0 mt-1.5 w-56 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-2.5 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] label-mono">
                          Environments
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 flex flex-col gap-0.5">
                          {environmentsList.map((e) => {
                            const isActive = e.id === activeEnv?.id;
                            return (
                              <button
                                key={e.id}
                                onClick={() => {
                                  setIsEnvDropdownOpen(false);
                                  setActiveEnv(e);
                                  localStorage.setItem('activeEnvironmentId', e.id);
                                  localStorage.setItem('activeEnvironmentName', e.name);
                                  window.dispatchEvent(new Event('envChanged'));
                                }}
                                className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-semibold text-[var(--color-foreground)] bg-[var(--color-surface-subtle)]' : 'text-[var(--color-secondary-text)] hover:bg-[var(--color-surface-subtle)]'
                                  }`}
                              >
                                <span className={`size-1.5 rounded-full shrink-0 ${e.name?.toLowerCase().includes('prod') ? 'bg-[var(--color-conflict)]' :
                                  e.name?.toLowerCase().includes('stag') ? 'bg-[var(--color-caution)]' :
                                    'bg-[var(--color-lime)]'
                                  }`} />
                                {e.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connected indicator — Manus "Local interactive demo" pattern */}
            <span className="hidden items-center gap-2 font-mono text-[10px] text-[var(--color-secondary-text)] md:flex">
              <span className="size-1.5 rounded-full bg-[var(--color-lime)]" />
              Connected
            </span>
            {activeOrg && (
              <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-lime)]/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
                {activeOrg.role}
              </span>
            )}
            {/* User avatar — Manus ink circle initials */}
            <div className="grid size-9 place-items-center rounded-full bg-[var(--color-ink)] font-mono text-xs font-bold text-[var(--color-cream)]">
              {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Inner page container */}
        <main className="flex-grow p-4 sm:p-6 lg:p-10 relative overflow-y-auto max-w-[1440px] w-full mx-auto">
          {orgError && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-500 font-mono text-xs flex justify-between items-start rounded-lg">
              <span>Error: {orgError}</span>
              <button onClick={() => setOrgError(null)} className="hover:text-black">✕</button>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Modals Layer */}

      {/* Create Organization Modal */}
      {isCreateOrgOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">CREATE ORGANIZATION</h2>
              <button type="button" onClick={() => setIsCreateOrgOpen(false)} className="text-[#8d8d8a] hover:text-[#131311] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-5 flex flex-col gap-4">
              {orgError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-500 font-mono text-xs flex justify-between items-start rounded-md shadow-3xs">
                  <span>Error: {orgError}</span>
                  <button type="button" onClick={() => setOrgError(null)} className="hover:text-black font-bold">✕</button>
                </div>
              )}
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                Organizations separate billing, projects, user teams, and edge evaluation boundaries.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">Organization Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateOrgOpen(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755] cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isOrgLoading}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isOrgLoading ? 'CREATING...' : 'CREATE ORG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Organization Modal */}
      {isEditOrgOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#131311]/12 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#131311]/8 bg-[#f3f2ea] flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#131311] uppercase tracking-tight">RENAME ORGANIZATION</h2>
              <button onClick={() => setIsEditOrgOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <form onSubmit={handleRenameOrg} className="p-5 flex flex-col gap-4">
              {orgError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-500 font-mono text-xs flex justify-between items-start rounded-md shadow-3xs">
                  <span>Error: {orgError}</span>
                  <button type="button" onClick={() => setOrgError(null)} className="hover:text-black font-bold">✕</button>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-wider">New Name</label>
                <input
                  required
                  type="text"
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  className="w-full bg-[#fffdf6] border border-[#131311]/12 text-[#131311] font-mono text-xs px-3 py-2.5 rounded-md focus:border-[#131311] focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditOrgOpen(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isOrgLoading}
                  className="bg-[#131311] text-[#fffdf6] hover:bg-black px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isOrgLoading ? 'RENAME...' : 'RENAME'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Organization Confirmation Modal */}
      {isDeleteOrgConfirmOpen && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 max-w-sm w-full relative shadow-2xl rounded-xl overflow-hidden">
            <div className="p-5 border-b border-red-100 bg-red-50 text-red-500 flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-red-500 uppercase tracking-tight">DELETE ORGANIZATION</h2>
              <button onClick={() => setIsDeleteOrgConfirmOpen(false)} className="text-[#8d8d8a] hover:text-[#131311]">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {orgError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-500 font-mono text-xs flex justify-between items-start rounded-md shadow-3xs">
                  <span>Error: {orgError}</span>
                  <button type="button" onClick={() => setOrgError(null)} className="hover:text-black font-bold">✕</button>
                </div>
              )}
              <p className="text-xs text-[#8d8d8a] leading-relaxed">
                Are you sure you want to delete organization <strong className="text-[#131311]">{activeOrg?.name}</strong>?
                This action is irreversible. All child projects, environments, API keys, and configurations will be permanently marked deleted.
              </p>

              <div className="mt-4 flex gap-2.5 justify-end">
                <button
                  onClick={() => setIsDeleteOrgConfirmOpen(false)}
                  className="px-4 py-2 border border-[#131311]/12 rounded-md hover:bg-[#f3f2ea] transition-all text-xs font-mono font-bold text-[#575755]"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDeleteOrg}
                  disabled={isOrgLoading}
                  className="bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-md transition-all text-xs font-mono font-bold disabled:opacity-50"
                >
                  {isOrgLoading ? 'DELETING...' : 'DELETE PERMANENTLY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
