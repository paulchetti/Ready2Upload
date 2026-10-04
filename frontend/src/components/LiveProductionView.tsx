import React, { useEffect, useState, useRef } from 'react';
import { Project, WorkflowTask, WorkflowEvent, QualityReport, Scene } from '@ready2upload/shared';
import { api, ProjectDetailResponse } from '../services/api';
import { CheckCircle2, Clock, AlertCircle, Play, Pause, RefreshCw, Terminal, Eye, Layers, ShieldCheck, Film } from 'lucide-react';

interface LiveProductionViewProps {
  project: Project;
  onRefreshProject: () => void;
  onViewStoryboard: () => void;
  onViewReview: () => void;
}

export const LiveProductionView: React.FC<LiveProductionViewProps> = ({
  project,
  onRefreshProject,
  onViewStoryboard,
  onViewReview
}) => {
  const [details, setDetails] = useState<ProjectDetailResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  const fetchDetails = async () => {
    try {
      const data = await api.getProject(project.id);
      setDetails(data);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Subscribe to real-time Server-Sent Events (SSE)
    const unsubscribe = api.subscribeToProjectStream(
      project.id,
      (event: WorkflowEvent) => {
        const timeStr = new Date().toLocaleTimeString();
        if (event.message) {
          setLogs((prev) => [...prev.slice(-100), `[${timeStr}] ${event.agentName ? `[${event.agentName}] ` : ''}${event.message}`]);
        }
        if (event.type === 'PROJECT_STATUS_CHANGED' || event.type === 'TASK_COMPLETED') {
          fetchDetails();
          onRefreshProject();
        }
      },
      () => {
        // Fallback polling if SSE disconnects
        fetchDetails();
      }
    );

    // Auto-scroll logs
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }

    return () => {
      unsubscribe();
    };
  }, [project.id]);

  const handleStartResume = async () => {
    setIsStarting(true);
    try {
      await api.startPipeline(project.id);
      await fetchDetails();
      onRefreshProject();
    } catch (err: any) {
      alert(`Error starting pipeline: ${err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePause = async () => {
    try {
      await api.pausePipeline(project.id);
      await fetchDetails();
      onRefreshProject();
    } catch (err: any) {
      alert(`Error pausing pipeline: ${err.message}`);
    }
  };

  // Pipeline execution stages
  const stages = [
    { key: 'RESEARCHING', label: '1. Research & Fact Grounding', agent: 'ResearchAgent', desc: 'Identifies core claims, academic sources, and historical records' },
    { key: 'SCRIPTING', label: '2. Creative Script & Hooks', agent: 'CreativeAgent', desc: 'Drafts spoken narrative, audience angle, and visual directives' },
    { key: 'STORYBOARDING', label: '3. Storyboard Breakdown', agent: 'StoryboardAgent', desc: 'Segments script into temporal scenes and visual prompts' },
    { key: 'GENERATING_MEDIA', label: '4. Media Generation (Visuals & Voice)', agent: 'MediaProductionAgent', desc: 'Generates scene imagery, synthesizes narration, builds subtitles & thumbnail' },
    { key: 'EDITING', label: '5. Deterministic Video Assembly', agent: 'VideoEditingAgent', desc: 'FFmpeg rendering, Ken Burns motion effects, audio mixing, MP4 master' },
    { key: 'QA_CHECK', label: '6. 15-Point Quality Control Audit', agent: 'QAAgent', desc: 'Automated verification of audio sync, duration, resolution, and sources' },
    { key: 'READY', label: '7. Deliverables Packaged & Download Ready', agent: 'ExportAgent', desc: 'Ready for creator download in Download Center' }
  ];

  const getStageStatus = (stageKey: string, index: number) => {
    const statusOrder = ['DRAFT', 'RESEARCHING', 'SCRIPTING', 'STORYBOARDING', 'GENERATING_MEDIA', 'EDITING', 'QA_CHECK', 'REVIEW', 'READY', 'COMPLETED'];
    const currentIdx = statusOrder.indexOf(project.status);
    const stageIdx = statusOrder.indexOf(stageKey);

    if (project.status === 'FAILED') return 'failed';
    if (project.status === 'READY' || project.status === 'COMPLETED') return 'completed';
    if (stageIdx < currentIdx) return 'completed';
    if (stageIdx === currentIdx) return 'running';
    return 'pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className={`badge ${project.status === 'READY' ? 'badge-pass' : project.status === 'FAILED' ? 'badge-fail' : 'badge-running'}`}>
              {project.status}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Format: {project.contentType} ({project.aspectRatio})</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duration: ~{project.targetDurationSec}s</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>{project.title}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Current Step: <strong style={{ color: 'var(--accent-cyan)' }}>{project.currentStep || 'Initializing'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {project.status === 'PAUSED' || project.status === 'DRAFT' || project.status === 'FAILED' ? (
            <button className="btn btn-primary" onClick={handleStartResume} disabled={isStarting}>
              <Play size={16} />
              <span>{isStarting ? 'Starting...' : 'Resume / Start'}</span>
            </button>
          ) : project.status === 'READY' ? (
            <button className="btn btn-primary" onClick={onViewReview}>
              <Film size={16} />
              <span>Review & Download</span>
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={handlePause}>
              <Pause size={16} />
              <span>Pause</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={fetchDetails}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Stages Pipeline & Live Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Stages Pipeline */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Studio Production Pipeline</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {stages.map((stage, idx) => {
              const status = getStageStatus(stage.key, idx);

              return (
                <div
                  key={stage.key}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: status === 'running' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: status === 'running' ? '1px solid rgba(0, 242, 254, 0.35)' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {status === 'completed' && <CheckCircle2 size={20} color="#10b981" />}
                    {status === 'running' && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid var(--accent-cyan)',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                    {status === 'pending' && <Clock size={20} color="#64748b" />}
                    {status === 'failed' && <AlertCircle size={20} color="#ef4444" />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4 style={{
                        fontSize: '0.95rem',
                        color: status === 'running' ? 'var(--accent-cyan)' : status === 'completed' ? 'var(--text-primary)' : 'var(--text-muted)'
                      }}>
                        {stage.label}
                      </h4>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: status === 'running' ? 'var(--accent-cyan)' : status === 'completed' ? '#10b981' : 'var(--text-muted)'
                      }}>
                        {status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Event Terminal & Quick Assets Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Live Terminal */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Terminal size={16} color="var(--accent-cyan)" />
              <h4 style={{ fontSize: '0.95rem' }}>Agent Execution Logs</h4>
            </div>

            <div
              ref={logTerminalRef}
              style={{
                flex: 1,
                backgroundColor: '#05070c',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#38bdf8',
                overflowY: 'auto',
                lineHeight: 1.6,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              {logs.length === 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>Listening for live agent events...</span>
              ) : (
                logs.map((log, index) => (
                  <div key={index} style={{ wordBreak: 'break-word' }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Metrics & Inspection Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '14px' }}>Intermediate Assets</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PLANNED SCENES</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{details?.scenes.length || 0}</p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GENERATED ASSETS</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{details?.assets.length || 0}</p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>QA AUDIT SCORE</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: details?.qualityReport ? '#10b981' : 'inherit' }}>
                  {details?.qualityReport ? `${details.qualityReport.score}/100` : 'Pending'}
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PROJECT SPEND</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  ${details?.cost.totalUsd.toFixed(3) || '0.000'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={onViewStoryboard}>
                <Layers size={14} /> Storyboard
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={onViewReview}>
                <Eye size={14} /> Review Studio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
