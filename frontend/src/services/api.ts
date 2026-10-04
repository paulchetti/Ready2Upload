import {
  Project,
  Scene,
  Asset,
  WorkflowTask,
  ContentBlueprint,
  ResearchDossier,
  QualityReport,
  WorkflowEvent,
  TimelineData,
  ContinuityManifest
} from '@ready2upload/shared';

const API_BASE = '/api';

export interface ProjectDetailResponse {
  project: Project;
  scenes: Scene[];
  assets: Asset[];
  tasks: WorkflowTask[];
  blueprint?: ContentBlueprint;
  research?: ResearchDossier;
  qualityReport?: QualityReport;
  cost: { totalUsd: number; records: any[] };
  timeline?: TimelineData;
  continuity?: ContinuityManifest;
  isActive: boolean;
}

export const api = {
  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to load projects');
    return res.json();
  },

  async createProject(data: {
    title?: string;
    topic: string;
    contentType?: string;
    aspectRatio?: string;
    targetDurationSec?: number;
    language?: string;
    visualStyle?: string;
    tone?: string;
    voiceId?: string;
    researchDepth?: string;
    autonomyLevel?: string;
    maxBudgetUsd?: number;
  }): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create project');
    }
    return res.json();
  },

  async getProject(id: string): Promise<ProjectDetailResponse> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project details');
    return res.json();
  },

  async getTimeline(id: string): Promise<TimelineData> {
    const res = await fetch(`${API_BASE}/projects/${id}/timeline`);
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return res.json();
  },

  async getContinuity(id: string): Promise<ContinuityManifest> {
    const res = await fetch(`${API_BASE}/projects/${id}/continuity`);
    if (!res.ok) throw new Error('Failed to fetch continuity profiles');
    return res.json();
  },

  async updateScenePrompt(
    projectId: string,
    sceneId: string,
    data: { visualPrompt?: string; narrationText?: string; transition?: string; animationType?: string }
  ): Promise<Scene> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/scenes/${sceneId}/prompt`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update scene prompt');
    return res.json();
  },

  async regenerateScene(projectId: string, sceneId: string): Promise<{ scene: Scene; asset: Asset }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/scenes/${sceneId}/regenerate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to regenerate scene');
    return res.json();
  },

  async startPipeline(id: string): Promise<{ message: string; status: string }> {
    const res = await fetch(`${API_BASE}/projects/${id}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start pipeline');
    return res.json();
  },

  async pausePipeline(id: string): Promise<{ message: string; status: string }> {
    const res = await fetch(`${API_BASE}/projects/${id}/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause pipeline');
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  getDownloadUrl(
    id: string,
    type: 'video' | 'thumbnail' | 'srt' | 'vtt' | 'script' | 'research' | 'sources' | 'timeline' | 'package'
  ): string {
    return `${API_BASE}/projects/${id}/download/${type}`;
  },

  subscribeToProjectStream(
    id: string,
    onEvent: (event: WorkflowEvent) => void,
    onError?: (err: any) => void
  ): () => void {
    const eventSource = new EventSource(`${API_BASE}/projects/${id}/stream`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  }
};
