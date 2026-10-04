import React from 'react';
import { Project, Asset } from '@ready2upload/shared';
import { api } from '../services/api';
import { Download, Film, Image as ImageIcon, FileText, Subtitles, Archive, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DownloadCenterProps {
  project: Project;
  assets: Asset[];
}

export const DownloadCenter: React.FC<DownloadCenterProps> = ({ project, assets }) => {
  const downloadCards = [
    {
      type: 'video' as const,
      title: 'Master Final Video',
      ext: '.mp4',
      badge: '1080p Master',
      desc: 'High-definition MP4 render with synchronized narration, dynamic motion graphics, and normalized audio (-14 LUFS).',
      icon: <Film size={24} color="var(--accent-cyan)" />
    },
    {
      type: 'thumbnail' as const,
      title: 'High-CTR Thumbnail',
      ext: '.png',
      badge: 'Cover Graphic',
      desc: 'High-contrast 16:9 thumbnail image designed for YouTube, Instagram, and social feeds.',
      icon: <ImageIcon size={24} color="#ffd700" />
    },
    {
      type: 'srt' as const,
      title: 'Subtitles (SRT)',
      ext: '.srt',
      badge: 'Captions',
      desc: 'Standard SubRip subtitle track formatted with millisecond speech timestamps.',
      icon: <Subtitles size={24} color="#34d399" />
    },
    {
      type: 'vtt' as const,
      title: 'Web Subtitles (VTT)',
      ext: '.vtt',
      badge: 'WebVTT',
      desc: 'HTML5 WebVTT caption file for video streaming players and online platforms.',
      icon: <Subtitles size={24} color="#38bdf8" />
    },
    {
      type: 'script' as const,
      title: 'Narrative Script',
      ext: '.md',
      badge: 'Documentation',
      desc: 'Complete spoken narration script with opening hook, scene cues, and word counts.',
      icon: <FileText size={24} color="#c084fc" />
    },
    {
      type: 'research' as const,
      title: 'Research Dossier',
      ext: '.md & .json',
      badge: 'Citations',
      desc: 'Verified historical, academic, and empirical claims with source attributions.',
      icon: <FileText size={24} color="#f472b6" />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-pass">Production Package Complete</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{project.contentType}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem' }}>Download Center</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Download your studio deliverables individually, or grab the complete packaged ZIP bundle for manual upload.
            </p>
          </div>

          <a
            href={api.getDownloadUrl(project.id, 'package')}
            className="btn btn-primary"
            style={{ padding: '14px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}
            download
          >
            <Archive size={20} />
            <span>DOWNLOAD COMPLETE PACKAGE (ZIP)</span>
          </a>
        </div>

        {/* Sovereignty Notice */}
        <div style={{
          marginTop: '20px',
          padding: '12px 18px',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldCheck size={20} color="#10b981" />
          <p style={{ fontSize: '0.82rem', color: '#a7f3d0' }}>
            <strong>100% Creator Sovereign:</strong> This platform performs zero automated publishing to YouTube, Instagram, X, TikTok, or other networks. The finished package is delivered directly to your device for manual publishing.
          </p>
        </div>
      </div>

      {/* Grid of Individual Deliverable Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {downloadCards.map((card) => (
          <div
            key={card.type}
            className="glass-panel"
            style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {card.icon}
                </div>
                <span className="badge badge-ready">{card.badge}</span>
              </div>

              <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>
                {card.title} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{card.ext}</span>
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {card.desc}
              </p>
            </div>

            <a
              href={api.getDownloadUrl(project.id, card.type)}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem' }}
              download
            >
              <Download size={15} />
              <span>Download {card.ext}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
