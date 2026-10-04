import { ContinuityManifest, CharacterProfile, LocationProfile, ObjectProfile, StyleProfile, TimelineData } from '@ready2upload/shared';
import { appDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';

interface ContinuityRow {
  id: string;
  project_id: string;
  profile_type: string;
  name: string;
  data_json: string;
  created_at: string;
}

interface TimelineRow {
  project_id: string;
  timeline_json: string;
  updated_at: string;
}

export class ContinuityRepository {
  public saveProfiles(projectId: string, manifest: ContinuityManifest): void {
    appDatabase.run('DELETE FROM continuity_profiles WHERE project_id = ?', [projectId]);

    const now = new Date().toISOString();

    for (const char of manifest.characters) {
      appDatabase.run(
        `INSERT OR REPLACE INTO continuity_profiles (id, project_id, profile_type, name, data_json, created_at)
         VALUES (?, ?, 'CHARACTER', ?, ?, ?)`,
        [uuidv4(), projectId, char.name, JSON.stringify(char), now]
      );
    }

    for (const loc of manifest.locations) {
      appDatabase.run(
        `INSERT OR REPLACE INTO continuity_profiles (id, project_id, profile_type, name, data_json, created_at)
         VALUES (?, ?, 'LOCATION', ?, ?, ?)`,
        [uuidv4(), projectId, loc.name, JSON.stringify(loc), now]
      );
    }

    for (const obj of manifest.objects) {
      appDatabase.run(
        `INSERT OR REPLACE INTO continuity_profiles (id, project_id, profile_type, name, data_json, created_at)
         VALUES (?, ?, 'OBJECT', ?, ?, ?)`,
        [uuidv4(), projectId, obj.name, JSON.stringify(obj), now]
      );
    }

    for (const style of manifest.styles) {
      appDatabase.run(
        `INSERT OR REPLACE INTO continuity_profiles (id, project_id, profile_type, name, data_json, created_at)
         VALUES (?, ?, 'STYLE', ?, ?, ?)`,
        [uuidv4(), projectId, style.overallAesthetic || 'MasterStyle', JSON.stringify(style), now]
      );
    }
  }

  public getProfiles(projectId: string): ContinuityManifest {
    const rows = appDatabase.all<ContinuityRow>(
      'SELECT * FROM continuity_profiles WHERE project_id = ?',
      [projectId]
    );

    const characters: CharacterProfile[] = [];
    const locations: LocationProfile[] = [];
    const objects: ObjectProfile[] = [];
    const styles: StyleProfile[] = [];

    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.data_json);
        if (r.profile_type === 'CHARACTER') characters.push(parsed);
        else if (r.profile_type === 'LOCATION') locations.push(parsed);
        else if (r.profile_type === 'OBJECT') objects.push(parsed);
        else if (r.profile_type === 'STYLE') styles.push(parsed);
      } catch (_e) {}
    }

    return { characters, locations, objects, styles };
  }

  public saveTimeline(projectId: string, timeline: TimelineData): void {
    const now = new Date().toISOString();
    const existing = appDatabase.get<TimelineRow>('SELECT project_id FROM timelines WHERE project_id = ?', [projectId]);

    if (existing) {
      appDatabase.run(
        'UPDATE timelines SET timeline_json = ?, updated_at = ? WHERE project_id = ?',
        [JSON.stringify(timeline), now, projectId]
      );
    } else {
      appDatabase.run(
        'INSERT INTO timelines (project_id, timeline_json, updated_at) VALUES (?, ?, ?)',
        [projectId, JSON.stringify(timeline), now]
      );
    }
  }

  public getTimeline(projectId: string): TimelineData | undefined {
    const row = appDatabase.get<TimelineRow>('SELECT timeline_json FROM timelines WHERE project_id = ?', [projectId]);
    if (!row) return undefined;
    try {
      return JSON.parse(row.timeline_json);
    } catch (_e) {
      return undefined;
    }
  }
}

export const continuityRepository = new ContinuityRepository();
