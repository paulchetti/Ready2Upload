import React, { useState } from 'react';
import { Sparkles, X, Clapperboard, Clock, Globe, Palette, Volume2, Search, Sliders } from 'lucide-react';
import { ContentType, AspectRatio, AutonomyLevel, Project } from '@ready2upload/shared';
import { api } from '../services/api';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export const CreateContentModal: React.FC<CreateContentModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<ContentType>('youtube_long');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [durationSec, setDurationSec] = useState<number>(300);
  const [language, setLanguage] = useState('English');
  const [visualStyle, setVisualStyle] = useState('Cinematic Documentary');
  const [tone, setTone] = useState('Authoritative & Engaging');
  const [researchDepth, setResearchDepth] = useState<'minimal' | 'standard' | 'deep'>('standard');
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('LEVEL_2_PRODUCTION');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    if (type === 'youtube_short' || type === 'instagram_reel') {
      setAspectRatio('9:16');
      setDurationSec(60);
    } else if (type === 'x_video') {
      setAspectRatio('1:1');
      setDurationSec(60);
    } else {
      setAspectRatio('16:9');
      setDurationSec(300);
    }
  };

  const handleStartProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a creative prompt or topic');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const project = await api.createProject({
        topic: topic.trim(),
        contentType,
        aspectRatio,
        targetDurationSec: durationSec,
        language,
        visualStyle,
        tone,
        researchDepth,
        autonomyLevel,
        maxBudgetUsd: 5.0
      });

      // Auto start background pipeline
      await api.startPipeline(project.id);

      onProjectCreated(project);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: '#0c0f17',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        boxShadow: '0 0 40px rgba(0, 242, 254, 0.15)',
        padding: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} color="#050811" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>Create New Content</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Provide a prompt and let the virtual studio orchestrate research, script, media, and final render.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleStartProduction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              What do you want to create? <span style={{ color: 'var(--accent-cyan)' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Create a 10-minute documentary explaining the archaeological and historical evidence for the Tower of Babel..."
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '14px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Try prompt:</span>
            {[
              'Tower of Babel archaeological evidence',
              '60-second explanation of black hole physics',
              'Educational documentary on Christian history: Psalm 119'
            ].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setTopic(preset)}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Content Type */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <Clapperboard size={14} /> Content Format
              </label>
              <select
                value={contentType}
                onChange={(e) => handleContentTypeChange(e.target.value as ContentType)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="youtube_long">YouTube Video (16:9 Landscape)</option>
                <option value="youtube_short">YouTube Short (9:16 Vertical)</option>
                <option value="instagram_reel">Instagram Reel (9:16 Vertical)</option>
                <option value="x_video">X / Social Video (1:1 Square)</option>
                <option value="educational_doc">Documentary / Explainer (16:9)</option>
              </select>
            </div>

            {/* Target Duration */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <Clock size={14} /> Target Duration
              </label>
              <select
                value={durationSec}
                onChange={(e) => setDurationSec(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value={30}>30 Seconds (Fast Demo)</option>
                <option value={60}>60 Seconds (Shorts / Reels)</option>
                <option value={180}>3 Minutes (Medium Explainer)</option>
                <option value={300}>5 Minutes (Full Video)</option>
                <option value={600}>10 Minutes (Deep Dive)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <Globe size={14} /> Narration Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="English">English</option>
                <option value="Telugu">Telugu</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>

            {/* Visual Style */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <Palette size={14} /> Visual Aesthetic Style
              </label>
              <select
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="Cinematic Documentary">Cinematic Documentary</option>
                <option value="Hyper-realistic 3D">Hyper-realistic 3D Render</option>
                <option value="Minimalist Graphic">Clean Minimalist Graphic</option>
                <option value="Cyberpunk Modern">Futuristic / High-Tech</option>
                <option value="Historic Oil Painting">Historical Painting / Classic</option>
              </select>
            </div>

            {/* Research Depth */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <Search size={14} /> Research Depth
              </label>
              <select
                value={researchDepth}
                onChange={(e) => setResearchDepth(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="standard">Standard (General Fact Checking)</option>
                <option value="deep">Deep (Academic, Historic Records)</option>
                <option value="minimal">Minimal (Creative / Story Focus)</option>
              </select>
            </div>

            {/* Autonomy Level */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <Sliders size={14} /> Autonomy Level
              </label>
              <select
                value={autonomyLevel}
                onChange={(e) => setAutonomyLevel(e.target.value as AutonomyLevel)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="LEVEL_2_PRODUCTION">Level 2: Production Agent (Autonomous to Package)</option>
                <option value="LEVEL_1_ASSISTED">Level 1: Assisted (Manual Confirmation)</option>
                <option value="LEVEL_3_AUTONOMOUS">Level 3: Full Auto</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Sparkles size={18} />
              <span>{isSubmitting ? 'Initializing Studio Pipeline...' : 'START PRODUCTION'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
