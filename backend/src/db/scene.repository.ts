import { Scene, SceneMediaType, SceneTransition, SceneAnimationType, VisualDirective, StructuredPrompt } from '@ready2upload/shared';
import { appDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';

interface SceneRow {
  id: string;
  project_id: string;
  scene_number: number;
  start_time_sec: number;
  duration_sec: number;
  narration_text: string;
  visual_prompt: string;
  media_type: string;
  text_overlay: string | null;
  transition: string;
  visual_directive_json: string | null;
  structured_prompt_json: string | null;
  animation_type: string | null;
  sound_effects_json: string | null;
  music_intensity: string | null;
  character_id: string | null;
  location_id: string | null;
  object_id: string | null;
  style_id: string | null;
  image_asset_id: string | null;
  video_asset_id: string | null;
  audio_stem_id: string | null;
}

function mapRowToScene(row: SceneRow): Scene {
  let visualDirective: VisualDirective | undefined;
  if (row.visual_directive_json) {
    try {
      visualDirective = JSON.parse(row.visual_directive_json);
    } catch (_e) {}
  }

  let structuredPrompt: StructuredPrompt | undefined;
  if (row.structured_prompt_json) {
    try {
      structuredPrompt = JSON.parse(row.structured_prompt_json);
    } catch (_e) {}
  }

  let soundEffects: string[] | undefined;
  if (row.sound_effects_json) {
    try {
      soundEffects = JSON.parse(row.sound_effects_json);
    } catch (_e) {}
  }

  return {
    id: row.id,
    projectId: row.project_id,
    sceneNumber: row.scene_number,
    startTimeSec: row.start_time_sec,
    durationSec: row.duration_sec,
    narrationText: row.narration_text,
    visualPrompt: row.visual_prompt,
    mediaType: row.media_type as SceneMediaType,
    textOverlay: row.text_overlay || undefined,
    transition: row.transition as SceneTransition,
    visualDirective,
    structuredPrompt,
    animationType: (row.animation_type as SceneAnimationType) || undefined,
    soundEffects,
    musicIntensity: row.music_intensity || undefined,
    characterId: row.character_id || undefined,
    locationId: row.location_id || undefined,
    objectId: row.object_id || undefined,
    styleId: row.style_id || undefined,
    imageAssetId: row.image_asset_id || undefined,
    videoAssetId: row.video_asset_id || undefined,
    audioStemId: row.audio_stem_id || undefined
  };
}

export class SceneRepository {
  public createBatch(projectId: string, scenes: Omit<Scene, 'id' | 'projectId'>[]): Scene[] {
    // Remove existing scenes for this project if overwriting
    appDatabase.run('DELETE FROM scenes WHERE project_id = ?', [projectId]);

    const created: Scene[] = [];
    for (const s of scenes) {
      const id = uuidv4();
      const scene: Scene = {
        id,
        projectId,
        ...s
      };

      appDatabase.run(
        `INSERT INTO scenes (
          id, project_id, scene_number, start_time_sec, duration_sec,
          narration_text, visual_prompt, media_type, text_overlay,
          transition, visual_directive_json, structured_prompt_json,
          animation_type, sound_effects_json, music_intensity,
          character_id, location_id, object_id, style_id,
          image_asset_id, video_asset_id, audio_stem_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scene.id,
          scene.projectId,
          scene.sceneNumber,
          scene.startTimeSec,
          scene.durationSec,
          scene.narrationText,
          scene.visualPrompt,
          scene.mediaType,
          scene.textOverlay || null,
          scene.transition,
          scene.visualDirective ? JSON.stringify(scene.visualDirective) : null,
          scene.structuredPrompt ? JSON.stringify(scene.structuredPrompt) : null,
          scene.animationType || null,
          scene.soundEffects ? JSON.stringify(scene.soundEffects) : null,
          scene.musicIntensity || null,
          scene.characterId || null,
          scene.locationId || null,
          scene.objectId || null,
          scene.styleId || null,
          scene.imageAssetId || null,
          scene.videoAssetId || null,
          scene.audioStemId || null
        ]
      );

      created.push(scene);
    }

    return created;
  }

  public findByProject(projectId: string): Scene[] {
    const rows = appDatabase.all<SceneRow>(
      'SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_number ASC',
      [projectId]
    );
    return rows.map(mapRowToScene);
  }

  public findById(id: string): Scene | undefined {
    const row = appDatabase.get<SceneRow>('SELECT * FROM scenes WHERE id = ?', [id]);
    return row ? mapRowToScene(row) : undefined;
  }

  public update(id: string, updates: Partial<Scene>): void {
    const existing = appDatabase.get<SceneRow>('SELECT * FROM scenes WHERE id = ?', [id]);
    if (!existing) return;

    appDatabase.run(
      `UPDATE scenes SET
        visual_prompt = COALESCE(?, visual_prompt),
        narration_text = COALESCE(?, narration_text),
        duration_sec = COALESCE(?, duration_sec),
        media_type = COALESCE(?, media_type),
        transition = COALESCE(?, transition),
        text_overlay = COALESCE(?, text_overlay),
        visual_directive_json = COALESCE(?, visual_directive_json),
        structured_prompt_json = COALESCE(?, structured_prompt_json),
        animation_type = COALESCE(?, animation_type),
        sound_effects_json = COALESCE(?, sound_effects_json),
        music_intensity = COALESCE(?, music_intensity),
        character_id = COALESCE(?, character_id),
        location_id = COALESCE(?, location_id),
        object_id = COALESCE(?, object_id),
        style_id = COALESCE(?, style_id),
        image_asset_id = COALESCE(?, image_asset_id),
        video_asset_id = COALESCE(?, video_asset_id),
        audio_stem_id = COALESCE(?, audio_stem_id)
      WHERE id = ?`,
      [
        updates.visualPrompt !== undefined ? updates.visualPrompt : null,
        updates.narrationText !== undefined ? updates.narrationText : null,
        updates.durationSec !== undefined ? updates.durationSec : null,
        updates.mediaType !== undefined ? updates.mediaType : null,
        updates.transition !== undefined ? updates.transition : null,
        updates.textOverlay !== undefined ? updates.textOverlay : null,
        updates.visualDirective !== undefined ? JSON.stringify(updates.visualDirective) : null,
        updates.structuredPrompt !== undefined ? JSON.stringify(updates.structuredPrompt) : null,
        updates.animationType !== undefined ? updates.animationType : null,
        updates.soundEffects !== undefined ? JSON.stringify(updates.soundEffects) : null,
        updates.musicIntensity !== undefined ? updates.musicIntensity : null,
        updates.characterId !== undefined ? updates.characterId : null,
        updates.locationId !== undefined ? updates.locationId : null,
        updates.objectId !== undefined ? updates.objectId : null,
        updates.styleId !== undefined ? updates.styleId : null,
        updates.imageAssetId !== undefined ? updates.imageAssetId : null,
        updates.videoAssetId !== undefined ? updates.videoAssetId : null,
        updates.audioStemId !== undefined ? updates.audioStemId : null,
        id
      ]
    );
  }
}

export const sceneRepository = new SceneRepository();
