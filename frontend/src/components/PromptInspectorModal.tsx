import React, { useState } from 'react';
import { Scene, Asset } from '@ready2upload/shared';
import { api } from '../services/api';
import { X, RefreshCw, Save, Edit3, Eye, Camera, Film, Mic, Sparkles, Sliders, CheckCircle } from 'lucide-react';

interface PromptInspectorModalProps {
  projectId: string;
  scene: Scene;
  assets: Asset[];
  onClose: () => void;
  onSceneUpdated: (updatedScene: Scene) => void;
}

export const PromptInspectorModal: React.FC<PromptInspectorModalProps> = ({
  projectId,
  scene,
  assets,
  onClose,
  onSceneUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [visualPrompt, setVisualPrompt] = useState(scene.visualPrompt || '');
  const [narrationText, setNarrationText] = useState(scene.narrationText || '');
  const [transition, setTransition] = useState(scene.transition || 'crossfade');
  const [animationType, setAnimationType] = useState(scene.animationType || 'slow_zoom_in');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const imageAsset = assets.find((a) => a.id === scene.imageAssetId || (a.sceneId === scene.id && a.assetType === 'IMAGE'));
  const audioAsset = assets.find((a) => a.id === scene.audioStemId || (a.sceneId === scene.id && a.assetType === 'AUDIO'));

  const handleSavePrompt = async () => {
    try {
      setIsSaving(true);
      setStatusMessage(null);
      const updated = await api.updateScenePrompt(projectId, scene.id, {
        visualPrompt,
        narrationText,
        transition,
        animationType
      });
      onSceneUpdated(updated);
      setIsEditing(false);
      setStatusMessage('Prompt and scene directives updated successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to save prompt: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm(`Regenerate visual asset for Scene ${scene.sceneNumber} using current prompt?`)) return;
    try {
      setIsRegenerating(true);
      setStatusMessage('Regenerating scene asset via AI pipeline...');
      const result = await api.regenerateScene(projectId, scene.id);
      onSceneUpdated(result.scene);
      setStatusMessage('Scene asset regenerated successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const directive = scene.visualDirective;
  const structured = scene.structuredPrompt;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #1e293b, #0f172a)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px'
              }}
            >
              #{scene.sceneNumber}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Prompt Inspector &amp; Visual Director
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: scene.mediaType === 'AI_VIDEO' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: scene.mediaType === 'AI_VIDEO' ? '#c084fc' : '#38bdf8',
                    border: `1px solid ${scene.mediaType === 'AI_VIDEO' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
                  }}
                >
                  {scene.mediaType}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Duration: <strong style={{ color: '#f1f5f9' }}>{scene.durationSec}s</strong>
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Motion: <strong style={{ color: '#f1f5f9' }}>{scene.animationType || 'slow_zoom_in'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: isEditing ? '#3b82f6' : '#1e293b',
                color: '#fff',
                border: '1px solid #475569'
              }}
            >
              {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
              {isEditing ? 'View Mode' : 'Edit Prompt'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle size={16} />
            {statusMessage}
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Preview & Narration Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gap: '20px',
              backgroundColor: '#1e293b',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            <div>
              {imageAsset ? (
                <img
                  src={`/api/projects/${projectId}/download/package?assetId=${imageAsset.id}`}
                  alt={`Scene ${scene.sceneNumber}`}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #475569'
                  }}
                  onError={(e) => {
                    // Fallback to placeholder gradient if image download URL requires direct asset route
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '150px',
                    borderRadius: '8px',
                    backgroundColor: '#0b0f19',
                    border: '1px dashed #475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontSize: '12px'
                  }}
                >
                  <Camera size={24} style={{ marginBottom: '6px' }} />
                  <span>No visual rendered</span>
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mic size={16} color="#38bdf8" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>Spoken Voice Narration</span>
              </div>
              {isEditing ? (
                <textarea
                  value={narrationText}
                  onChange={(e) => setNarrationText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{scene.narrationText}"
                </p>
              )}

              {/* Timing & Motion Settings in Edit Mode */}
              {isEditing && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Camera Motion</label>
                    <select
                      value={animationType}
                      onChange={(e) => setAnimationType(e.target.value as any)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    >
                      <option value="slow_zoom_in">Slow Zoom In (Ken Burns)</option>
                      <option value="slow_zoom_out">Slow Zoom Out</option>
                      <option value="pan_left">Pan Left Tracking</option>
                      <option value="pan_right">Pan Right Tracking</option>
                      <option value="vertical_movement">Vertical Drift</option>
                      <option value="static">Static Framing</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Transition</label>
                    <select
                      value={transition}
                      onChange={(e) => setTransition(e.target.value as any)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    >
                      <option value="crossfade">Crossfade (Default)</option>
                      <option value="fade">Fade to Black</option>
                      <option value="cut">Direct Cut</option>
                      <option value="dissolve">Dissolve</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Section */}
          <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#f59e0b" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                  {scene.mediaType === 'AI_VIDEO' ? 'Video Generation Prompt' : 'Image Generation Prompt'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {scene.mediaType === 'AI_VIDEO' ? 'Optimized for temporal diffusion' : 'Optimized for high-fidelity photorealism'}
              </span>
            </div>

            {isEditing ? (
              <textarea
                value={visualPrompt}
                onChange={(e) => setVisualPrompt(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  backgroundColor: '#020617',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            ) : (
              <div
                style={{
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  wordBreak: 'break-word'
                }}
              >
                {scene.visualPrompt}
              </div>
            )}
          </div>

          {/* Structured Directives & Continuity Breakdown */}
          {directive && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Composition &amp; Camera</div>
                <div style={{ fontSize: '13px', color: '#f1f5f9', marginTop: '4px', fontWeight: 600 }}>{directive.cameraPerspective}</div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Lighting &amp; Mood</div>
                <div style={{ fontSize: '13px', color: '#f1f5f9', marginTop: '4px', fontWeight: 600 }}>{directive.lighting} — {directive.mood}</div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Audio &amp; SFX Cues</div>
                <div style={{ fontSize: '13px', color: '#f1f5f9', marginTop: '4px', fontWeight: 600 }}>
                  Score: {directive.musicIntensity || 'ambient'} | SFX: {directive.soundEffects?.join(', ') || 'none'}
                </div>
              </div>
            </div>
          )}

          {/* Continuity Reference Info */}
          {structured?.continuity && (
            <div
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#a5b4fc',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sliders size={16} />
              <span>
                <strong>Continuity Anchor:</strong> {structured.continuity}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0b0f19'
          }}
        >
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#d97706',
              color: '#fff',
              border: 'none',
              cursor: isRegenerating ? 'not-allowed' : 'pointer',
              opacity: isRegenerating ? 0.7 : 1
            }}
          >
            <RefreshCw size={15} className={isRegenerating ? 'spin' : ''} />
            {isRegenerating ? 'Regenerating Asset...' : 'Regenerate Asset'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isEditing && (
              <button
                onClick={handleSavePrompt}
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={15} />
                {isSaving ? 'Saving...' : 'Save Prompt Changes'}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: '#334155',
                color: '#f8fafc',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
