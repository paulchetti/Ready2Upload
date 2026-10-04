import { ContentBlueprint, ResearchDossier, QualityReport, CostRecord } from '@ready2upload/shared';
import { appDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';

export class BlueprintRepository {
  public saveBlueprint(blueprint: ContentBlueprint): void {
    appDatabase.run(
      `INSERT OR REPLACE INTO content_blueprints (
        project_id, title, hook, target_audience, tone, language,
        estimated_duration_sec, script_body, spoken_word_count, thumbnail_concepts_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        blueprint.projectId,
        blueprint.title,
        blueprint.hook,
        blueprint.targetAudience,
        blueprint.tone,
        blueprint.language,
        blueprint.estimatedDurationSec,
        blueprint.scriptBody,
        blueprint.spokenWordCount,
        JSON.stringify(blueprint.thumbnailConcepts)
      ]
    );
  }

  public getBlueprint(projectId: string): ContentBlueprint | undefined {
    const row = appDatabase.get<any>(
      'SELECT * FROM content_blueprints WHERE project_id = ?',
      [projectId]
    );
    if (!row) return undefined;

    return {
      projectId: row.project_id,
      title: row.title,
      hook: row.hook,
      targetAudience: row.target_audience,
      tone: row.tone,
      language: row.language,
      estimatedDurationSec: row.estimated_duration_sec,
      scriptBody: row.script_body,
      spokenWordCount: row.spoken_word_count,
      thumbnailConcepts: JSON.parse(row.thumbnail_concepts_json || '[]')
    };
  }

  public saveResearch(research: ResearchDossier): void {
    appDatabase.run(
      `INSERT OR REPLACE INTO research_dossiers (
        project_id, topic, summary, key_claims_json, sources_json, notes_markdown
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        research.projectId,
        research.topic,
        research.summary,
        JSON.stringify(research.keyClaims),
        JSON.stringify(research.sources),
        research.notesMarkdown
      ]
    );
  }

  public getResearch(projectId: string): ResearchDossier | undefined {
    const row = appDatabase.get<any>(
      'SELECT * FROM research_dossiers WHERE project_id = ?',
      [projectId]
    );
    if (!row) return undefined;

    return {
      projectId: row.project_id,
      topic: row.topic,
      summary: row.summary,
      keyClaims: JSON.parse(row.key_claims_json || '[]'),
      sources: JSON.parse(row.sources_json || '[]'),
      notesMarkdown: row.notes_markdown
    };
  }
}

export class QARepository {
  public saveReport(report: QualityReport): void {
    appDatabase.run(
      `INSERT OR REPLACE INTO quality_reports (
        id, project_id, overall_status, score, checks_json, evaluated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        report.id,
        report.projectId,
        report.overallStatus,
        report.score,
        JSON.stringify(report.checks),
        report.evaluatedAt
      ]
    );
  }

  public getReport(projectId: string): QualityReport | undefined {
    const row = appDatabase.get<any>(
      'SELECT * FROM quality_reports WHERE project_id = ? ORDER BY evaluated_at DESC LIMIT 1',
      [projectId]
    );
    if (!row) return undefined;

    return {
      id: row.id,
      projectId: row.project_id,
      overallStatus: row.overall_status,
      score: row.score,
      checks: JSON.parse(row.checks_json || '[]'),
      evaluatedAt: row.evaluated_at
    };
  }
}

export class CostRepository {
  public recordCost(cost: Omit<CostRecord, 'id' | 'timestamp'>): CostRecord {
    const record: CostRecord = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...cost
    };

    appDatabase.run(
      `INSERT INTO cost_records (
        id, project_id, provider, model, operation, tokens_used, compute_seconds, cost_usd, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.projectId,
        record.provider,
        record.model,
        record.operation,
        record.tokensUsed || null,
        record.computeSeconds || null,
        record.costUsd,
        record.timestamp
      ]
    );

    return record;
  }

  public getProjectCost(projectId: string): { totalUsd: number; records: CostRecord[] } {
    const records = appDatabase.all<any>(
      'SELECT * FROM cost_records WHERE project_id = ? ORDER BY timestamp DESC',
      [projectId]
    ).map((r) => ({
      id: r.id,
      projectId: r.project_id,
      provider: r.provider,
      model: r.model,
      operation: r.operation,
      tokensUsed: r.tokens_used || undefined,
      computeSeconds: r.compute_seconds || undefined,
      costUsd: r.cost_usd,
      timestamp: r.timestamp
    }));

    const totalUsd = records.reduce((sum, r) => sum + r.costUsd, 0);
    return { totalUsd, records };
  }
}

export const blueprintRepository = new BlueprintRepository();
export const qaRepository = new QARepository();
export const costRepository = new CostRepository();
