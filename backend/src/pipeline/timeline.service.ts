import {
  Project,
  Scene,
  Asset,
  TimelineData,
  TimelineVideoClip,
  TimelineNarrationCue,
  TimelineSubtitleCue
} from '@ready2upload/shared';
import { AudioDesignPlan } from './audio-design.service';
import { continuityRepository } from '../db/continuity.repository';
import { storageService } from '../storage/storage.service';

export class TimelineService {
  /**
   * Compiles multi-track timeline.json with synchronized visual, narration, music, sfx, and subtitle tracks.
   */
  public buildTimeline(
    project: Project,
    scenes: Scene[],
    assets: Asset[],
    audioPlan: AudioDesignPlan
  ): TimelineData {
    // Map assets by scene ID
    const imagesByScene = new Map<string, Asset>();
    const audioByScene = new Map<string, Asset>();
    const videoByScene = new Map<string, Asset>();

    for (const a of assets) {
      if (a.sceneId) {
        if (a.assetType === 'IMAGE') imagesByScene.set(a.sceneId, a);
        if (a.assetType === 'AUDIO') audioByScene.set(a.sceneId, a);
        if (a.assetType === 'VIDEO') videoByScene.set(a.sceneId, a);
      }
    }

    let currentTimestamp = 0;
    const videoTrack: TimelineVideoClip[] = [];
    const narrationTrack: TimelineNarrationCue[] = [];
    const subtitleTrack: TimelineSubtitleCue[] = [];

    let subIndex = 1;

    for (const s of scenes) {
      const startSec = Math.round(currentTimestamp * 100) / 100;
      const durationSec = Math.max(2.5, Math.round(s.durationSec * 100) / 100);
      const endSec = Math.round((startSec + durationSec) * 100) / 100;

      // Determine asset path
      let assetPath = '';
      if (s.mediaType === 'AI_VIDEO' && videoByScene.has(s.id)) {
        assetPath = videoByScene.get(s.id)!.filePath;
      } else if (imagesByScene.has(s.id)) {
        assetPath = imagesByScene.get(s.id)!.filePath;
      }

      // Add to Video track
      videoTrack.push({
        id: `vclip-${s.id}`,
        sceneId: s.id,
        sceneNumber: s.sceneNumber,
        mediaType: s.mediaType,
        startSec,
        endSec,
        durationSec,
        assetPath,
        transition: s.transition || 'crossfade',
        animationType: s.animationType || 'slow_zoom_in',
        textOverlay: s.textOverlay
      });

      // Add to Narration track
      const audioAsset = audioByScene.get(s.id);
      if (audioAsset) {
        narrationTrack.push({
          id: `narr-${s.id}`,
          sceneId: s.id,
          startSec,
          endSec,
          durationSec,
          text: s.narrationText,
          audioPath: audioAsset.filePath
        });
      }

      // Add to Subtitle track
      subtitleTrack.push({
        index: subIndex++,
        startSec: startSec + 0.1,
        endSec: endSec - 0.1,
        text: s.narrationText
      });

      currentTimestamp += durationSec;
    }

    const totalDurationSec = Math.round(currentTimestamp * 100) / 100;

    let resolution = '1920x1080';
    if (project.aspectRatio === '9:16') resolution = '1080x1920';
    else if (project.aspectRatio === '1:1') resolution = '1080x1080';

    const timelineData: TimelineData = {
      projectId: project.id,
      totalDurationSec,
      aspectRatio: project.aspectRatio,
      resolution,
      fps: 30,
      tracks: {
        video: videoTrack,
        narration: narrationTrack,
        music: audioPlan.musicCues,
        sfx: audioPlan.sfxCues,
        subtitles: subtitleTrack
      },
      generatedAt: new Date().toISOString()
    };

    // Persist to DB and storage
    continuityRepository.saveTimeline(project.id, timelineData);
    storageService.writeProjectFile(
      project.id,
      'content/timeline.json',
      JSON.stringify(timelineData, null, 2)
    );

    return timelineData;
  }
}

export const timelineService = new TimelineService();
