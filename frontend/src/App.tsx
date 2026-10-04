import React, { useState, useEffect } from 'react';
import { Project } from '@ready2upload/shared';
import { api, ProjectDetailResponse } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar, NavView } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CreateContentModal } from './components/CreateContentModal';
import { LiveProductionView } from './components/LiveProductionView';
import { StoryboardView } from './components/StoryboardView';
import { TimelineView } from './components/TimelineView';
import { ReviewStudio } from './components/ReviewStudio';
import { DownloadCenter } from './components/DownloadCenter';
import { AssetLibrary } from './components/AssetLibrary';
import './styles/theme.css';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetailResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const list = await api.listProjects();
      setProjects(list);
      if (list.length > 0 && !activeProjectId) {
        setActiveProjectId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to list projects:', err);
    }
  };

  const fetchActiveProjectDetails = async (id: string) => {
    try {
      const data = await api.getProject(id);
      setProjectDetails(data);
    } catch (err) {
      console.error('Failed to fetch details:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      fetchActiveProjectDetails(activeProjectId);
    }
  }, [activeProjectId]);

  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
    if (project.status === 'READY') {
      setCurrentView('review');
    } else {
      setCurrentView('live');
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setCurrentView('live');
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeProject={activeProject}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          hasActiveProject={!!activeProject}
        />

        <main style={{ flex: 1, padding: '32px 40px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          {currentView === 'dashboard' && (
            <DashboardView
              projects={projects}
              onOpenCreate={() => setIsCreateOpen(true)}
              onSelectProject={handleSelectProject}
            />
          )}

          {currentView === 'create' && (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '12px' }}>Start a Production</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Create a high-quality video or social asset package from a natural language prompt.
              </p>
              <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                <span>Open Production Creator</span>
              </button>
            </div>
          )}

          {currentView === 'projects' && (
            <DashboardView
              projects={projects}
              onOpenCreate={() => setIsCreateOpen(true)}
              onSelectProject={handleSelectProject}
            />
          )}

          {currentView === 'live' && activeProject && (
            <LiveProductionView
              project={activeProject}
              onRefreshProject={() => {
                fetchProjects();
                if (activeProjectId) fetchActiveProjectDetails(activeProjectId);
              }}
              onViewStoryboard={() => setCurrentView('storyboard')}
              onViewReview={() => setCurrentView('review')}
            />
          )}

          {currentView === 'storyboard' && activeProject && (
            <StoryboardView
              project={activeProject}
              scenes={projectDetails?.scenes || []}
              assets={projectDetails?.assets || []}
              onRefresh={() => {
                fetchProjects();
                if (activeProjectId) fetchActiveProjectDetails(activeProjectId);
              }}
            />
          )}

          {currentView === 'timeline' && activeProject && (
            <TimelineView
              project={activeProject}
              scenes={projectDetails?.scenes || []}
              assets={projectDetails?.assets || []}
              timeline={projectDetails?.timeline}
              qualityReport={projectDetails?.qualityReport}
              onRefreshProject={() => {
                fetchProjects();
                if (activeProjectId) fetchActiveProjectDetails(activeProjectId);
              }}
            />
          )}

          {currentView === 'review' && activeProject && (
            <ReviewStudio
              project={activeProject}
              blueprint={projectDetails?.blueprint}
              qualityReport={projectDetails?.qualityReport}
              assets={projectDetails?.assets || []}
              scenes={projectDetails?.scenes || []}
              research={projectDetails?.research}
              onGoToDownloads={() => setCurrentView('download')}
              onRestartPipeline={async () => {
                await api.startPipeline(activeProject.id);
                setCurrentView('live');
              }}
            />
          )}

          {currentView === 'download' && activeProject && (
            <DownloadCenter
              project={activeProject}
              assets={projectDetails?.assets || []}
            />
          )}

          {currentView === 'assets' && activeProject && (
            <AssetLibrary
              project={activeProject}
              assets={projectDetails?.assets || []}
            />
          )}

          {currentView === 'settings' && (
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ marginBottom: '16px' }}>Studio & Provider Settings</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Configure AI generation providers, maximum project cost limits, and brand guidelines.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ACTIVE LLM ENGINE</label>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>Mock Provider (Zero-Cost Local Simulator) / Google Gemini</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VIDEO RENDERING ENGINE</label>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>Bundled FFmpeg 6.1 (Hardware Accelerated H.264 / AAC)</p>
                </div>

                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PUBLISHING POLICY</label>
                  <p style={{ fontWeight: 600, color: '#34d399', marginTop: '2px' }}>
                    100% Download-First. Zero Direct Social Media Uploads.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateContentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
