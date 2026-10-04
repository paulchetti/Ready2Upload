import React, { useState } from 'react';
import { Project, ContentBlueprint, QualityReport, Asset, Scene, ResearchDossier } from '@ready2upload/shared';
import { Play, Download, CheckCircle2, AlertTriangle, XCircle, FileText, Sparkles, RefreshCw, Film, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

interface ReviewStudioProps {
  project: Project;
  blueprint?: ContentBlueprint;
  qualityReport?: QualityReport;
  assets: Asset[];
  scenes: Scene[];
  research?: ResearchDossier;
  onGoToDownloads: () => void;
  onRestartPipeline: () => void;
}

export const ReviewStudio: React.FC<ReviewStudioProps> = ({
  project,
  blueprint,
  qualityReport,
  assets,
  scenes,
  research,
  onGoToDownloads,
  onRestartPipeline
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'script' | 'qa' | 'research'>('video');

  const finalVideoAsset = assets.find((a) => a.assetType === 'VIDEO');
  const thumbnailAsset = assets.find((a) => a.assetType === 'THUMBNAIL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-ready">Review & Quality Studio</span>
            {qualityReport && (
              <span className={`badge ${qualityReport.overallStatus === 'PASS' ? 'badge-pass' : qualityReport.overallStatus === 'WARN' ? 'badge-warn' : 'badge-fail'}`}>
                QA Score: {qualityReport.score}/100 ({qualityReport.overallStatus})
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.5rem' }}>{project.title}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Inspect final rendered MP4, review subtitles and script, verify 15-point QA audit, and proceed to Download Center.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onRestartPipeline}>
            <RefreshCw size={16} />
            <span>Render Again</span>
          </button>
          <button className="btn btn-primary" onClick={onGoToDownloads}>
            <Download size={16} />
            <span>Go to Download Center</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {[
          { id: 'video', label: 'Video Player & Thumbnail', icon: <Film size={16} /> },
          { id: 'script', label: 'Full Script & Hook', icon: <FileText size={16} /> },
          { id: 'qa', label: `QA Report (${qualityReport?.score ?? 0}/100)`, icon: <CheckCircle2 size={16} /> },
          { id: 'research', label: 'Verified Research Dossier', icon: <Sparkles size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="btn"
            style={{
              backgroundColor: activeTab === tab.id ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: activeTab === tab.id ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
              fontSize: '0.88rem'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Video Player & Thumbnail */}
      {activeTab === 'video' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Video Player */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={18} color="var(--accent-cyan)" />
              <span>Master Video Player ({project.aspectRatio})</span>
            </h3>

            <div style={{
              width: '100%',
              aspectRatio: project.aspectRatio === '9:16' ? '9/16' : '16/9',
              maxHeight: '520px',
              backgroundColor: '#000',
              borderRadius: '10px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)'
            }}>
              {finalVideoAsset ? (
                <video
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  src={`/storage/projects/${project.id}/renders/final_video.mp4`}
                >
                  <track
                    kind="subtitles"
                    label="English"
                    src={`/storage/projects/${project.id}/content/subtitles.vtt`}
                    default
                  />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Film size={48} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p>Video rendering has not yet executed.</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Resolution: <strong>{finalVideoAsset?.resolution || '1080p'}</strong> | Bitrate: <strong>4500 kbps</strong> | Audio: <strong>-14 LUFS</strong>
              </span>

              <a
                href={api.getDownloadUrl(project.id, 'video')}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
                download
              >
                <Download size={14} /> Download Master MP4
              </a>
            </div>
          </div>

          {/* Thumbnail & Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="var(--accent-cyan)" />
                <span>Generated Thumbnail</span>
              </h3>

              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                backgroundColor: '#05070c',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}>
                {thumbnailAsset ? (
                  <img
                    src={`/storage/projects/${project.id}/content/thumbnail.png`}
                    alt="Thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Thumbnail not ready
                  </div>
                )}
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <a
                  href={api.getDownloadUrl(project.id, 'thumbnail')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                  download
                >
                  <Download size={13} /> Download Thumbnail
                </a>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Video Properties</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Duration:</span>
                  <span>{project.targetDurationSec}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Scenes:</span>
                  <span>{scenes.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Spoken Words:</span>
                  <span>{blueprint?.spokenWordCount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Aspect Ratio:</span>
                  <span>{project.aspectRatio}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Script & Hook */}
      {activeTab === 'script' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          {blueprint ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span className="badge badge-running" style={{ marginBottom: '8px' }}>Opening Hook (First 5 Seconds)</span>
                <blockquote style={{
                  padding: '16px 20px',
                  backgroundColor: 'rgba(0, 242, 254, 0.06)',
                  borderLeft: '4px solid var(--accent-cyan)',
                  borderRadius: '6px',
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  color: 'var(--text-primary)'
                }}>
                  "{blueprint.hook}"
                </blockquote>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Full Spoken Narration Script</h3>
                <div style={{
                  backgroundColor: 'var(--bg-input)',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  lineHeight: 1.7,
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {blueprint.scriptBody}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <a href={api.getDownloadUrl(project.id, 'script')} className="btn btn-secondary" download>
                  <Download size={14} /> Download script.md
                </a>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Script has not been drafted yet.</p>
          )}
        </div>
      )}

      {/* Tab 3: QA Report */}
      {activeTab === 'qa' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          {qualityReport ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>15-Point Automated Quality Control Audit</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Pre-export verification of video container, audio levels, subtitle sync, and source claims.
                  </p>
                </div>
                <div style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  backgroundColor: qualityReport.overallStatus === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: qualityReport.overallStatus === 'PASS' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>VERIFICATION SCORE</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: qualityReport.overallStatus === 'PASS' ? '#34d399' : '#fbbf24' }}>
                    {qualityReport.score} / 100
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {qualityReport.checks.map((check) => (
                  <div
                    key={check.checkId}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {check.status === 'PASS' && <CheckCircle2 size={18} color="#10b981" />}
                      {check.status === 'WARN' && <AlertTriangle size={18} color="#f59e0b" />}
                      {check.status === 'FAIL' && <XCircle size={18} color="#ef4444" />}
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{check.name}</span>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {check.description}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${check.status === 'PASS' ? 'badge-pass' : check.status === 'WARN' ? 'badge-warn' : 'badge-fail'}`}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>QA Report has not been executed yet.</p>
          )}
        </div>
      )}

      {/* Tab 4: Research Dossier */}
      {activeTab === 'research' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          {research ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Research Summary</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {research.summary}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Verified Claims & Sources</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {research.keyClaims.map((claim, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <p style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        ✓ {claim.claim}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                        Source: {claim.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <a href={api.getDownloadUrl(project.id, 'research')} className="btn btn-secondary" download>
                  <Download size={14} /> Download research_notes.md
                </a>
                <a href={api.getDownloadUrl(project.id, 'sources')} className="btn btn-secondary" download>
                  <Download size={14} /> Download research_sources.json
                </a>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Research dossier is pending generation.</p>
          )}
        </div>
      )}
    </div>
  );
};
