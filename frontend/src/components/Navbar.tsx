import React from 'react';
import { Video, ShieldCheck, Sparkles, PlusCircle } from 'lucide-react';
import { Project } from '@ready2upload/shared';

interface NavbarProps {
  activeProject?: Project;
  onOpenCreate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeProject, onOpenCreate }) => {
  return (
    <header style={{
      height: '68px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(8, 9, 13, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)'
        }}>
          <Video size={20} color="#050811" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
              READY<span style={{ color: 'var(--accent-cyan)' }}>2</span>UPLOAD
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              letterSpacing: '0.06em'
            }}>
              STUDIO
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Autonomous AI Content Production Platform</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {activeProject && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Project:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeProject.title}
            </span>
            <span className={`badge ${activeProject.status === 'READY' ? 'badge-pass' : activeProject.status === 'FAILED' ? 'badge-fail' : 'badge-running'}`}>
              {activeProject.status}
            </span>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: '#34d399',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <ShieldCheck size={14} />
          <span>Local & Sovereign (Zero Auto-Publish)</span>
        </div>

        <button className="btn btn-primary" onClick={onOpenCreate}>
          <PlusCircle size={17} />
          <span>Create Content</span>
        </button>
      </div>
    </header>
  );
};
