import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { History, HelpCircle } from 'lucide-react';
import { getProjectByIdWithinOrganization } from '../../services/projectService';
import { type Project } from '../../types';

export const AuditLogListPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const response = await getProjectByIdWithinOrganization(projectId);
        if (response.data) {
          setProject(response.data);
        }
      } catch (err) {
        console.error('Failed to load project details for audit logs list', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectDetails();
  }, [projectId]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-[#131311]/5 pb-5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#131311]/40"></div>
          <span className="font-mono text-[9px] text-[#8d8d8a] uppercase tracking-widest">
            Project: {isLoading ? 'Loading...' : project?.name || '—'}
          </span>
        </div>
        <h2 className="font-display font-black text-2xl text-[#131311] uppercase tracking-tight">
          AUDIT LOGS
        </h2>
        <p className="text-xs text-[#8d8d8a] mt-0.5">Track configuration modifications, user logins, and key rotations.</p>
      </div>

      {/* Main Workspace Placeholder */}
      <div className="border border-dashed border-[#131311]/12 bg-[#f3f2ea]/10 p-12 flex flex-col items-center justify-center min-h-[300px] text-[#8d8d8a] text-center rounded-xl">
        <History className="w-10 h-10 text-[#131311]/15 mb-3" />
        <span className="font-mono text-xs uppercase tracking-wider mb-1.5 text-[#131311] font-bold">Audit History</span>
        <p className="text-xs max-w-xs leading-relaxed font-sans mb-4">
          Monitor configuration changes, track actors, timestamps, and old vs new values.
        </p>
        <div className="font-mono text-[10px] text-[#8d8d8a] bg-white border border-[#131311]/5 px-3 py-1.5 rounded-md shadow-2xs">
          AUDIT LOGS VIEW WILL BE WIRED IN SUBSEQUENT PHASES
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="mt-6 pt-5 border-t border-[#131311]/8 flex items-start gap-3.5 text-xs text-[#8d8d8a] leading-relaxed">
        <HelpCircle className="w-4.5 h-4.5 text-[#131311]/20 shrink-0" />
        <div>
          <h4 className="font-mono font-bold text-[#131311] uppercase mb-0.5 text-[11px]">Historical Persistence</h4>
          <p className="max-w-xl font-sans">
            Audit logs are long-lived and cannot be edited or deleted by any user, ensuring full trace compliance for enterprise auditing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogListPage;
