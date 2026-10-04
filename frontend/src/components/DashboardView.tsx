import React from 'react';
import { Project } from '@ready2upload/shared';
import { Sparkles, Clapperboard, Clock, ShieldCheck, Film, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  onOpenCreate: () => void;
  onSelectProject: (project: Project) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ projects, onOpenCreate, onSelectProject }) => {
  const completedProjects = projects.filter((p) => p.status === 'READY' || p.status === 'COMPLETED');
  const totalMinutes = Math.round(projects.reduce((sum, p) => sum + (p.targetDurationSec || 0), 0) / 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Hero Welcome Banner */}
      <div className="glass-panel glass-panel-glow" style={{
        padding: '36px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(18, 23, 36, 0.9) 0%, rgba(26, 33, 52, 0.7) 100%)'
      }}>
        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-running">Autonomous Studio</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Multi-Agent Virtual Production Team</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginBottom: '12px' }}>
            Transform Ideas into <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Finished Content Packages</span>
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
            Autonomous research, scriptwriting, scene storyboarding, image/clip generation, voice synthesis, automated video assembly with motion effects, subtitles, and quality control. Download your master files and publish manually.
          </p>
          <div style={{ display: 'flex', gap: '14px' }}>
            <button className="btn btn-primary" onClick={onOpenCreate} style={{ padding: '12px 24px', fontSize: '1rem' }}>
              <Sparkles size={18} />
              <span>+ Create Content</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL PRODUCTIONS</span>
            <Clapperboard size={18} color="var(--accent-cyan)" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{projects.length}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Projects across all formats</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PRODUCED DURATION</span>
            <Clock size={18} color="#ffd700" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalMinutes} min</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Content timeline synthesized</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PACKAGES READY</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{completedProjects.length}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Verified & downloadable</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PUBLISHING BOUNDARY</span>
            <ShieldCheck size={18} color="#34d399" />
          </div>
          <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '6px' }}>100% Sovereign</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Zero automated publishing</span>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="glass-panel" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Recent Production Projects</h3>
          <button className="btn btn-secondary" onClick={onOpenCreate} style={{ fontSize: '0.85rem' }}>
            <span>+ New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Film size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.95rem' }}>No projects created yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Click "+ Create Content" to start your first production.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.slice(0, 8).map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 242, 254, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(0, 242, 254, 0.2)'
                  }}>
                    <Film size={18} color="var(--accent-cyan)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{project.title}</h4>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{project.contentType}</span>
                      <span>•</span>
                      <span>{project.aspectRatio}</span>
                      <span>•</span>
                      <span>{project.targetDurationSec}s</span>
                      <span>•</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className={`badge ${project.status === 'READY' ? 'badge-pass' : project.status === 'FAILED' ? 'badge-fail' : 'badge-running'}`}>
                    {project.status}
                  </span>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
