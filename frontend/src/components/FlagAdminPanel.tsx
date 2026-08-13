import React from 'react';
import { ToggleLeft, ToggleRight, Sliders, Globe, Shield, Activity, Users, Settings } from 'lucide-react';

interface FlagAdminPanelProps {
  flagEnabled: boolean;
  rolloutPercent: number;
  onToggle: (enabled: boolean) => void;
  onRolloutChange: (percent: number) => void;
  showRollout?: boolean;
  showTargeting?: boolean;
}

export const FlagAdminPanel: React.FC<FlagAdminPanelProps> = ({
  flagEnabled,
  rolloutPercent,
  onToggle,
  onRolloutChange,
  showRollout = true,
  showTargeting = false,
}) => {
  const totalUsers = 8;
  const activeUserCount = Math.round((rolloutPercent / 100) * totalUsers);

  return (
    <div className="w-full max-w-sm mx-auto bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded p-5 font-mono text-[10px] select-none transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)] mb-4">
        <div className="flex items-center gap-1.5 font-bold text-current">
          <Settings className="w-3.5 h-3.5" />
          <span className="tracking-tight uppercase">FLAG CONFIG</span>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] bg-[var(--theme-surface-subtle)] px-2 py-0.5 border border-[var(--theme-border)] rounded">
          <Globe className="w-2.5 h-2.5" />
          <span>ENV: PRODUCTION</span>
        </div>
      </div>

      {/* Flag Info */}
      <div className="space-y-3 mb-5">
        <div>
          <div className="text-[8px] text-[var(--theme-text-muted)] mb-0.5">KEY</div>
          <div className="text-xs font-bold text-current">new_checkout</div>
        </div>

        {/* Toggle Panel */}
        <div className="flex items-center justify-between bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] p-3 rounded text-current">
          <div>
            <div className="font-bold">Global Switch</div>
            <div className="text-[9px] text-[var(--theme-text-secondary)] mt-0.5">Toggle flag state globally</div>
          </div>
          <button
            onClick={() => onToggle(!flagEnabled)}
            className="focus:outline-none transition-all duration-200"
          >
            {flagEnabled ? (
              <ToggleRight className="w-8 h-8 text-[#c6fd50] cursor-pointer" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-[var(--theme-text-muted)] cursor-pointer" />
            )}
          </button>
        </div>
      </div>

      {/* Progressive Rollout */}
      {showRollout && (
        <div className="space-y-4 pt-3 border-t border-[var(--theme-border)] text-current">
          <div className="flex justify-between items-center">
            <span className="font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Progressive Rollout
            </span>
            <span className="font-bold text-xs">{rolloutPercent}%</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              value={rolloutPercent}
              onChange={(e) => onRolloutChange(Number(e.target.value))}
              className="w-full h-1 bg-[var(--theme-border)] rounded appearance-none cursor-ew-resize accent-[#131311]"
              style={{
                background: `linear-gradient(to right, #c6fd50 0%, #c6fd50 ${rolloutPercent}%, var(--theme-border) ${rolloutPercent}%, var(--theme-border) 100%)`
              }}
            />
          </div>

          {/* Grid representation */}
          <div className="bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] p-3 rounded">
            <div className="flex justify-between items-center text-[9px] text-[var(--theme-text-muted)] mb-2">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Active Cohort
              </span>
              <span>{activeUserCount} of 8 targeted</span>
            </div>
            
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: totalUsers }).map((_, idx) => {
                const isActive = idx < activeUserCount && flagEnabled;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center py-1.5 border rounded transition-all duration-300 ${
                      isActive
                        ? 'border-[#c6fd50] bg-[#c6fd50] text-[#131311] font-bold scale-105'
                        : 'border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] opacity-40'
                    }`}
                  >
                    <span className="text-[11px]">👤</span>
                    <span className="text-[7px] mt-0.5">{isActive ? '✓' : '✗'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Targeting Rules */}
      {showTargeting && (
        <div className="space-y-3 pt-3 border-t border-[var(--theme-border)] text-current">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Targeting Rules
            </span>
            <span className="text-[8px] bg-[#131311] text-[#c6fd50] px-1.5 py-0.2 rounded font-black border border-[#c6fd50]/10">
              3 RULES MATCHED
            </span>
          </div>

          <div className="bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] p-2.5 rounded space-y-1.5 text-[9px]">
            <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-1">
              <span className="text-[var(--theme-text-secondary)]">Group: Beta Users</span>
              <span className="font-bold text-[#c6fd50] bg-[#131311] px-1.5 rounded">MATCH ✓</span>
            </div>
            <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-1">
              <span className="text-[var(--theme-text-secondary)]">Country: India</span>
              <span className="font-bold text-[#c6fd50] bg-[#131311] px-1.5 rounded">MATCH ✓</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--theme-text-secondary)]">App Version: &gt;= 2.4.0</span>
              <span className="font-bold text-[#c6fd50] bg-[#131311] px-1.5 rounded">MATCH ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex justify-between text-[8px] text-[var(--theme-text-muted)]">
        <span className="flex items-center gap-1">
          <Activity className="w-2.5 h-2.5" />
          ACTIVE EVALUATION
        </span>
        <span>v3.0.4</span>
      </div>
    </div>
  );
};
