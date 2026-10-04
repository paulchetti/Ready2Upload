import React, { useState } from 'react';
import { Project, Scene, Asset } from '@ready2upload/shared';
import { Layers, Clock, Film, Image as ImageIcon, Volume2, Type, Sparkles } from 'lucide-react';
import { PromptInspectorModal } from './PromptInspectorModal';

interface StoryboardViewProps {
  project: Project;
  scenes: Scene[];
  assets: Asset[];
  onRefresh?: () => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({ project, scenes, assets, onRefresh }) => {
  const [inspectingScene, setInspectingScene] = useState<Scene | null>(null);
  const imagesByScene = new Map<string, Asset>();
  const audioByScene = new Map<string, Asset>();

  for (const a of assets) {
    if (a.sceneId) {
      if (a.assetType === 'IMAGE') imagesByScene.set(a.sceneId, a);
      if (a.assetType === 'AUDIO') audioByScene.set(a.sceneId, a);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-running">Storyboard Matrix</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{scenes.length} Planned Scenes</span>
          </div>
          <h2 style={{ fontSize: '1.5rem' }}>Visual & Audio Storyboard</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Sequential timeline detailing visual generation directives, scene durations, and spoken narration.
          </p>
        </div>
      </div>

      {scenes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p>Storyboard has not been planned yet. Start the production pipeline to generate scenes.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {scenes.map((scene) => {
            const imageAsset = imagesByScene.get(scene.id);
            const audioAsset = audioByScene.get(scene.id);

            const startMin = Math.floor(scene.startTimeSec / 60);
            const startSec = Math.floor(scene.startTimeSec % 60);
            const endMin = Math.floor((scene.startTimeSec + scene.durationSec) / 60);
            const endSec = Math.floor((scene.startTimeSec + scene.durationSec) % 60);

            const timeRange = `${startMin}:${String(startSec).padStart(2, '0')} - ${endMin}:${String(endSec).padStart(2, '0')}`;

            return (
              <div
                key={scene.id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'rgba(15, 18, 26, 0.8)'
                }}
              >
                {/* Visual Preview / Header */}
                <div style={{
                  height: '180px',
                  backgroundColor: '#07090e',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  {imageAsset ? (
                    <img
                      src={`/storage/projects/${project.id}/assets/images/${imageAsset.fileName}`}
                      alt={`Scene ${scene.sceneNumber}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback if image path differs
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={32} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.75rem' }}>Image generation in progress</p>
                    </div>
                  )}

                  {/* Scene Number & Duration Tag */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    display: 'flex',
                    gap: '6px'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: 'var(--accent-cyan)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      Scene {scene.sceneNumber}
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: '#f8fafc',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} /> {timeRange} ({scene.durationSec}s)
                    </span>
                  </div>

                  {/* Media Type & Transition Tag */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '6px'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.7rem'
                    }}>
                      {scene.mediaType}
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.7rem'
                    }}>
                      {scene.transition}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {/* Narration */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <Volume2 size={12} /> SPOKEN NARRATION
                    </label>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.45, fontStyle: 'italic' }}>
                      "{scene.narrationText}"
                    </p>
                  </div>

                  {/* Visual Prompt */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <Sparkles size={12} /> VISUAL DIRECTIVE
                    </label>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {scene.visualPrompt}
                    </p>
                  </div>

                  {/* Text Overlay */}
                  {scene.textOverlay && (
                    <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <Type size={11} /> ON-SCREEN OVERLAY
                      </label>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        backgroundColor: 'rgba(0, 242, 254, 0.1)',
                        color: 'var(--accent-cyan)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 242, 254, 0.2)'
                      }}>
                        {scene.textOverlay}
                      </span>
                    </div>
                  )}

                  {/* Prompt Inspection Action */}
                  <div style={{ paddingTop: '8px' }}>
                    <button
                      onClick={() => setInspectingScene(scene)}
                      style={{
                        width: '100%',
                        padding: '7px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#93c5fd',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Sparkles size={13} />
                      [VIEW / EDIT PROMPT]
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inspectingScene && (
        <PromptInspectorModal
          projectId={project.id}
          scene={inspectingScene}
          assets={assets}
          onClose={() => setInspectingScene(null)}
          onSceneUpdated={() => {
            setInspectingScene(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};
