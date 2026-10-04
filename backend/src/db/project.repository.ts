import { Project, ProjectStatus, ContentType, AspectRatio, AutonomyLevel } from '@ready2upload/shared';
import { appDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';

interface ProjectRow {
  id: string;
  title: string;
  topic: string;
  content_type: string;
  aspect_ratio: string;
  target_duration_sec: number;
  language: string;
  visual_style: string;
  tone: string;
  voice_id: string;
  research_depth: string;
  status: string;
  autonomy_level: string;
  max_budget_usd: number;
  current_step: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    contentType: row.content_type as ContentType,
    aspectRatio: row.aspect_ratio as AspectRatio,
    targetDurationSec: row.target_duration_sec,
    language: row.language,
    visualStyle: row.visual_style,
    tone: row.tone,
    voiceId: row.voice_id,
    researchDepth: row.research_depth as 'minimal' | 'standard' | 'deep',
    status: row.status as ProjectStatus,
    autonomyLevel: row.autonomy_level as AutonomyLevel,
    maxBudgetUsd: row.max_budget_usd,
    currentStep: row.current_step,
    errorMessage: row.error_message || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class ProjectRepository {
  public create(data: {
    title: string;
    topic: string;
    contentType?: ContentType;
    aspectRatio?: AspectRatio;
    targetDurationSec?: number;
    language?: string;
    visualStyle?: string;
    tone?: string;
    voiceId?: string;
    researchDepth?: 'minimal' | 'standard' | 'deep';
    autonomyLevel?: AutonomyLevel;
    maxBudgetUsd?: number;
  }): Project {
    const id = uuidv4();
    const now = new Date().toISOString();

    const contentType = data.contentType || 'youtube_long';
    const aspectRatio = data.aspectRatio || (contentType === 'youtube_short' || contentType === 'instagram_reel' ? '9:16' : '16:9');
    const targetDurationSec = data.targetDurationSec || (contentType === 'youtube_short' || contentType === 'instagram_reel' ? 60 : 300);

    const project: Project = {
      id,
      title: data.title,
      topic: data.topic,
      contentType,
      aspectRatio,
      targetDurationSec,
      language: data.language || 'English',
      visualStyle: data.visualStyle || 'Cinematic Documentary',
      tone: data.tone || 'Engaging & Authoritative',
      voiceId: data.voiceId || 'default',
      researchDepth: data.researchDepth || 'standard',
      status: 'DRAFT',
      autonomyLevel: data.autonomyLevel || 'LEVEL_2_PRODUCTION',
      maxBudgetUsd: data.maxBudgetUsd || 5.0,
      currentStep: 'CREATED',
      createdAt: now,
      updatedAt: now
    };

    appDatabase.run(
      `INSERT INTO projects (
        id, title, topic, content_type, aspect_ratio, target_duration_sec,
        language, visual_style, tone, voice_id, research_depth,
        status, autonomy_level, max_budget_usd, current_step, error_message,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project.id,
        project.title,
        project.topic,
        project.contentType,
        project.aspectRatio,
        project.targetDurationSec,
        project.language,
        project.visualStyle,
        project.tone,
        project.voiceId,
        project.researchDepth,
        project.status,
        project.autonomyLevel,
        project.maxBudgetUsd,
        project.currentStep,
        null,
        project.createdAt,
        project.updatedAt
      ]
    );

    return project;
  }

  public findById(id: string): Project | undefined {
    const row = appDatabase.get<ProjectRow>('SELECT * FROM projects WHERE id = ?', [id]);
    return row ? mapRowToProject(row) : undefined;
  }

  public list(): Project[] {
    const rows = appDatabase.all<ProjectRow>('SELECT * FROM projects ORDER BY created_at DESC');
    return rows.map(mapRowToProject);
  }

  public updateStatus(id: string, status: ProjectStatus, currentStep: string, errorMessage?: string): void {
    const now = new Date().toISOString();
    appDatabase.run(
      'UPDATE projects SET status = ?, current_step = ?, error_message = ?, updated_at = ? WHERE id = ?',
      [status, currentStep, errorMessage || null, now, id]
    );
  }

  public update(id: string, updates: Partial<Project>): Project | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    appDatabase.run(
      `UPDATE projects SET
        title = ?, topic = ?, content_type = ?, aspect_ratio = ?,
        target_duration_sec = ?, language = ?, visual_style = ?, tone = ?,
        voice_id = ?, research_depth = ?, status = ?, autonomy_level = ?,
        max_budget_usd = ?, current_step = ?, error_message = ?, updated_at = ?
      WHERE id = ?`,
      [
        merged.title,
        merged.topic,
        merged.contentType,
        merged.aspectRatio,
        merged.targetDurationSec,
        merged.language,
        merged.visualStyle,
        merged.tone,
        merged.voiceId,
        merged.researchDepth,
        merged.status,
        merged.autonomyLevel,
        merged.maxBudgetUsd,
        merged.currentStep,
        merged.errorMessage || null,
        merged.updatedAt,
        id
      ]
    );

    return merged;
  }

  public delete(id: string): void {
    appDatabase.run('DELETE FROM projects WHERE id = ?', [id]);
  }
}

export const projectRepository = new ProjectRepository();
