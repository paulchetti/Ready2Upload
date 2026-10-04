import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  Activity,
  Layers,
  FileCheck2,
  Download,
  Image as ImageIcon,
  Sliders,
  Settings
} from 'lucide-react';

export type NavView =
  | 'dashboard'
  | 'create'
  | 'projects'
  | 'live'
  | 'storyboard'
  | 'timeline'
  | 'review'
  | 'download'
  | 'assets'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  hasActiveProject: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, hasActiveProject }) => {
  const navItems: Array<{ id: NavView; label: string; icon: React.ReactNode; requiresProject?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'create', label: 'Create Content', icon: <Sparkles size={18} /> },
    { id: 'projects', label: 'All Projects', icon: <FolderKanban size={18} /> },
    { id: 'live', label: 'Live Studio', icon: <Activity size={18} />, requiresProject: true },
    { id: 'storyboard', label: 'Storyboard', icon: <Layers size={18} />, requiresProject: true },
    { id: 'timeline', label: 'Production Timeline', icon: <Sliders size={18} />, requiresProject: true },
    { id: 'review', label: 'Review & QA', icon: <FileCheck2 size={18} />, requiresProject: true },
    { id: 'download', label: 'Download Center', icon: <Download size={18} />, requiresProject: true },
    { id: 'assets', label: 'Media Library', icon: <ImageIcon size={18} />, requiresProject: true },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      height: 'calc(100vh - 68px)',
      position: 'sticky',
      top: '68px',
      userSelect: 'none'
    }}>
      <div style={{ padding: '0 12px 12px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        Studio Navigation
      </div>

      {navItems.map((item) => {
        const isActive = currentView === item.id;
        const isDisabled = item.requiresProject && !hasActiveProject;

        return (
          <button
            key={item.id}
            onClick={() => !isDisabled && onNavigate(item.id)}
            disabled={isDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: '9px',
              border: isActive ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
              backgroundColor: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
              color: isActive ? 'var(--accent-cyan)' : isDisabled ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.45 : 1,
              fontFamily: 'var(--font-heading)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.9rem',
              textAlign: 'left',
              transition: 'all 0.18s ease',
              width: '100%'
            }}
          >
            <span style={{ color: isActive ? 'var(--accent-cyan)' : 'inherit' }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AUTONOMY ENGINE</p>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Level 2: Production Agent</p>
      </div>
    </aside>
  );
};
