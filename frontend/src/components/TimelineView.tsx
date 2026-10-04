import React, { useState } from 'react';
import { Project, Scene, Asset, TimelineData, QualityReport } from '@ready2upload/shared';
import { api } from '../services/api';
import { PromptInspectorModal } from './PromptInspectorModal';
import {
  Film,
  Mic,
  Music,
  Volume2,
  Subtitles,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Camera
} from 'lucide-react';

interface TimelineViewProps {
  project: Project;
  scenes: Scene[];
  assets: Asset[];
  timeline?: TimelineData;
  qualityReport?: QualityReport;
  onRefreshProject: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  project,
  scenes,
  assets,
  timeline,
  qualityReport,
  onRefreshProject
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [inspectingScene, setInspectingScene] = useState<Scene | null>(null);
  const [isReRendering, setIsReRendering] = useState(false);

  const selectedScene = scenes[selectedSceneIndex] || scenes[0];
  const videoAsset = assets.find((a) => a.assetType === 'VIDEO');

  const totalDuration = timeline?.totalDurationSec || scenes.reduce((sum, s) => sum + s.durationSec, 0);

  const handleReRender = async () => {
    try {
      setIsReRendering(true);
      await api.startPipeline(project.id);
      onRefreshProject();
    } catch (err: any) {
      alert(`Render error: ${err.message}`);
    } finally {
      setIsReRendering(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          padding: '16px 24px',
          borderRadius: '12px',
          border: '1px solid #1e293b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
              Full-Length Video Production Timeline
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Total Assembled Duration: <strong style={{ color: '#38bdf8' }}>{totalDuration}s</strong>
              </span>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Scenes: <strong style={{ color: '#f1f5f9' }}>{scenes.length}</strong>
              </span>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Aspect: <strong style={{ color: '#f1f5f9' }}>{project.aspectRatio}</strong>
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a
            href={api.getDownloadUrl(project.id, 'timeline')}
            download
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <Download size={14} />
            timeline.json
          </a>

          <button
            onClick={handleReRender}
            disabled={isReRendering}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isReRendering ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <RotateCcw size={15} className={isReRendering ? 'spin' : ''} />
            {isReRendering ? 'Re-Rendering Master...' : 'Re-Render Video'}
          </button>
        </div>
      </div>

      {/* Main Preview & Scene Director Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Video Player / Master Preview */}
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Master Timeline Player
            </span>
            {videoAsset ? (
              <span style={{ fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Final Render Ready
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> Assembly in progress
              </span>
            )}
          </div>

          <div
            style={{
              width: '100%',
              backgroundColor: '#000',
              borderRadius: '10px',
              overflow: 'hidden',
              aspectRatio: project.aspectRatio === '9:16' ? '9/16' : '16/9',
              maxHeight: '360px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #334155'
            }}
          >
            {videoAsset ? (
              <video
                controls
                src={api.getDownloadUrl(project.id, 'video')}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                <Film size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>Timeline preview will render upon workflow execution.</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Scene Director Inspector */}
        {selectedScene && (
          <div
            style={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                  Selected Scene
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  Scene {selectedScene.sceneNumber}: {selectedScene.textOverlay || 'Documentary Sequence'}
                </h3>
              </div>
              <button
                onClick={() => setInspectingScene(selectedScene)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={14} />
                [VIEW / EDIT PROMPT]
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#1e293b',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#cbd5e1',
                lineHeight: '1.6',
                fontStyle: 'italic',
                borderLeft: '4px solid #38bdf8'
              }}
            >
              "{selectedScene.narrationText}"
            </div>

            {/* Directive specs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#131b2e', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Media Decision</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{selectedScene.mediaType}</span>
              </div>
              <div style={{ backgroundColor: '#131b2e', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Camera Motion</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{selectedScene.animationType || 'slow_zoom_in'}</span>
              </div>
              <div style={{ backgroundColor: '#131b2e', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Transition</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{selectedScene.transition || 'crossfade'}</span>
              </div>
              <div style={{ backgroundColor: '#131b2e', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Scene Duration</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{selectedScene.durationSec}s</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Active Generation Prompt Preview:</div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#94a3b8',
                  maxHeight: '70px',
                  overflowY: 'auto',
                  backgroundColor: '#0b0f19',
                  padding: '8px',
                  borderRadius: '6px'
                }}
              >
                {selectedScene.visualPrompt}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Track Interactive Production Timeline */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#6366f1" /> Multi-Track Synchronization Grid
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Click any scene block to inspect directives &amp; prompts
          </span>
        </div>

        {/* Tracks Container */}
        <div
          style={{
            backgroundColor: '#020617',
            borderRadius: '10px',
            border: '1px solid #1e293b',
            padding: '16px',
            overflowX: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* TRACK 1: Visuals & Video Clips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '110px', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Film size={14} color="#818cf8" /> Visual Track
            </div>
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              {scenes.map((scene, idx) => {
                const isSelected = idx === selectedSceneIndex;
                const widthPercent = Math.max(8, (scene.durationSec / Math.max(1, totalDuration)) * 100);

                let bgGrad = 'linear-gradient(135deg, #1e293b, #334155)';
                if (scene.mediaType === 'AI_VIDEO') bgGrad = 'linear-gradient(135deg, #7e22ce, #9333ea)';
                else if (scene.mediaType === 'MAP') bgGrad = 'linear-gradient(135deg, #b45309, #d97706)';
                else if (scene.mediaType === 'TEXT_GRAPHIC') bgGrad = 'linear-gradient(135deg, #0e7490, #0891b2)';
                else bgGrad = 'linear-gradient(135deg, #2563eb, #3b82f6)';

                return (
                  <div
                    key={scene.id}
                    onClick={() => setSelectedSceneIndex(idx)}
                    style={{
                      flex: `${widthPercent} 0 0%`,
                      minWidth: '100px',
                      height: '56px',
                      background: bgGrad,
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected ? '0 0 12px rgba(255, 255, 255, 0.4)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>#{scene.sceneNumber}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>{scene.durationSec}s</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {scene.animationType || scene.mediaType}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TRACK 2: Spoken Voice Narration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '110px', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mic size={14} color="#38bdf8" /> Voice Stems
            </div>
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              {scenes.map((scene, idx) => {
                const widthPercent = Math.max(8, (scene.durationSec / Math.max(1, totalDuration)) * 100);
                return (
                  <div
                    key={`voice-${scene.id}`}
                    onClick={() => setSelectedSceneIndex(idx)}
                    style={{
                      flex: `${widthPercent} 0 0%`,
                      minWidth: '100px',
                      height: '36px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#7dd3fc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🎙️ {scene.narrationText.slice(0, 30)}...
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TRACK 3: Background Music & Ducking */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '110px', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Music size={14} color="#a855f7" /> Music Score
            </div>
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              <div
                style={{
                  flex: 1,
                  height: '34px',
                  background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#d8b4fe' }}>
                  🎵 Cinematic Documentary Theme (Intro → Tension → Outro)
                </span>
                <span style={{ fontSize: '10px', color: '#c084fc', backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '2px 6px', borderRadius: '4px' }}>
                  Auto-Ducked (-14dB)
                </span>
              </div>
            </div>
          </div>

          {/* TRACK 4: Sound Effects (SFX) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '110px', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={14} color="#f59e0b" /> SFX Cues
            </div>
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              {scenes.map((scene) => {
                const widthPercent = Math.max(8, (scene.durationSec / Math.max(1, totalDuration)) * 100);
                const hasSfx = scene.soundEffects && scene.soundEffects.length > 0;
                return (
                  <div
                    key={`sfx-${scene.id}`}
                    style={{
                      flex: `${widthPercent} 0 0%`,
                      minWidth: '100px',
                      height: '28px',
                      backgroundColor: hasSfx ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                      border: hasSfx ? '1px dashed #f59e0b' : 'none',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 6px'
                    }}
                  >
                    {hasSfx && (
                      <span style={{ fontSize: '10px', color: '#fbbf24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔊 {scene.soundEffects![0]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TRACK 5: Subtitles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '110px', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Subtitles size={14} color="#10b981" /> Subtitles
            </div>
            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              {scenes.map((scene) => {
                const widthPercent = Math.max(8, (scene.durationSec / Math.max(1, totalDuration)) * 100);
                return (
                  <div
                    key={`sub-${scene.id}`}
                    style={{
                      flex: `${widthPercent} 0 0%`,
                      minWidth: '100px',
                      height: '24px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '10px', color: '#6ee7b7' }}>CUE #{scene.sceneNumber}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Inspector Modal */}
      {inspectingScene && (
        <PromptInspectorModal
          projectId={project.id}
          scene={inspectingScene}
          assets={assets}
          onClose={() => setInspectingScene(null)}
          onSceneUpdated={(updated) => {
            setInspectingScene(null);
            onRefreshProject();
          }}
        />
      )}
    </div>
  );
};
