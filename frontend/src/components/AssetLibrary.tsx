import React from 'react';
import { Asset, Project } from '@ready2upload/shared';
import { ImageIcon, Volume2, Film, Download, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface AssetLibraryProps {
  project: Project;
  assets: Asset[];
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ project, assets }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-running">Asset Repository</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{assets.length} Generated Files</span>
          </div>
          <h2 style={{ fontSize: '1.5rem' }}>Project Media Library</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Inspect, preview, and download individual visual assets, narration audio stems, and renders.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
        {assets.map((asset) => {
          const isImage = asset.assetType === 'IMAGE' || asset.assetType === 'THUMBNAIL';
          const isAudio = asset.assetType === 'AUDIO';
          const isVideo = asset.assetType === 'VIDEO';

          const sizeKb = Math.round(asset.fileSizeBytes / 1024);

          return (
            <div
              key={asset.id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: 'rgba(15, 18, 26, 0.85)'
              }}
            >
              <div style={{
                height: '160px',
                backgroundColor: '#05070c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                borderBottom: '1px solid var(--border-color)'
              }}>
                {isImage && (
                  <img
                    src={`/storage/projects/${project.id}/${asset.assetType === 'THUMBNAIL' ? 'content' : 'assets/images'}/${asset.fileName}`}
                    alt={asset.fileName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}

                {isAudio && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Volume2 size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 8px' }} />
                    <audio
                      controls
                      src={`/storage/projects/${project.id}/assets/audio/${asset.fileName}`}
                      style={{ width: '220px', height: '32px' }}
                    />
                  </div>
                )}

                {isVideo && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Film size={36} color="#c084fc" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.8rem' }}>Master Video ({asset.resolution})</p>
                  </div>
                )}

                <span style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  color: 'var(--accent-cyan)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}>
                  {asset.assetType}
                </span>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, wordBreak: 'break-all' }}>
                  {asset.fileName}
                </p>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Size: {sizeKb} KB</span>
                  <span>Provider: {asset.provider}</span>
                </div>

                {asset.prompt && (
                  <p style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {asset.prompt}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
