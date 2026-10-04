import { Scene, TimelineMusicCue, TimelineSFXCue } from '@ready2upload/shared';
import { storageService } from '../storage/storage.service';
import { createMockWavAudio } from '../providers/mock/mock.media';
import path from 'path';
import fs from 'fs';

export interface AudioDesignPlan {
  musicCues: TimelineMusicCue[];
  sfxCues: TimelineSFXCue[];
}

export class AudioDesignService {
  /**
   * Plans music structure (intro, tension, background, outro) with volume ducking,
   * and maps SFX cues onto timeline timestamps.
   */
  public createAudioPlan(projectId: string, scenes: Scene[], totalDurationSec: number): AudioDesignPlan {
    const musicCues: TimelineMusicCue[] = [];
    const sfxCues: TimelineSFXCue[] = [];

    const projectDir = storageService.getProjectDir(projectId);
    const audioDir = path.join(projectDir, 'audio', 'design');
    storageService.ensureDirectory(audioDir);

    // 1. Music Cues
    if (totalDurationSec <= 30) {
      // Single continuous track for short videos
      const trackPath = path.join(audioDir, 'music_master.wav');
      if (!fs.existsSync(trackPath)) {
        const wav = createMockWavAudio(totalDurationSec, 220); // Low, subtle ambient drone
        fs.writeFileSync(trackPath, wav);
      }

      musicCues.push({
        id: 'mus-1',
        title: 'Cinematic Documentary Drone',
        style: 'ambient orchestral',
        mood: 'epic & contemplative',
        intensity: 'building',
        startSec: 0,
        endSec: totalDurationSec,
        volume: 0.22,
        duckingLevel: 0.10, // -14dB relative ducking when voice active
        audioPath: trackPath
      });
    } else {
      // Multi-section scoring for longer documentaries
      const introDuration = Math.min(20, Math.round(totalDurationSec * 0.25));
      const outroDuration = Math.min(25, Math.round(totalDurationSec * 0.25));
      const midDuration = totalDurationSec - introDuration - outroDuration;

      const introPath = path.join(audioDir, 'music_intro.wav');
      const midPath = path.join(audioDir, 'music_mid.wav');
      const outroPath = path.join(audioDir, 'music_outro.wav');

      if (!fs.existsSync(introPath)) {
        fs.writeFileSync(introPath, createMockWavAudio(introDuration, 220));
      }
      if (!fs.existsSync(midPath)) {
        fs.writeFileSync(midPath, createMockWavAudio(midDuration, 180));
      }
      if (!fs.existsSync(outroPath)) {
        fs.writeFileSync(outroPath, createMockWavAudio(outroDuration, 260));
      }

      musicCues.push(
        {
          id: 'mus-intro',
          title: 'Opening Theme & Atmosphere',
          style: 'warm string pads & ethnic flute',
          mood: 'curious & majestic',
          intensity: 'building',
          startSec: 0,
          endSec: introDuration,
          volume: 0.25,
          duckingLevel: 0.12,
          audioPath: introPath
        },
        {
          id: 'mus-mid',
          title: 'Deep Exploration & Historical Tension',
          style: 'percussive tension drone',
          mood: 'tense & analytical',
          intensity: 'tension',
          startSec: introDuration,
          endSec: introDuration + midDuration,
          volume: 0.20,
          duckingLevel: 0.08,
          audioPath: midPath
        },
        {
          id: 'mus-outro',
          title: 'Culmination & Triumphant Resolution',
          style: 'orchestral brass & choir swelling',
          mood: 'epic resolution',
          intensity: 'triumphant',
          startSec: introDuration + midDuration,
          endSec: totalDurationSec,
          volume: 0.28,
          duckingLevel: 0.14,
          audioPath: outroPath
        }
      );
    }

    // 2. SFX Cues from Scenes
    for (const scene of scenes) {
      if (scene.soundEffects && scene.soundEffects.length > 0) {
        for (let i = 0; i < scene.soundEffects.length; i++) {
          const sfxName = scene.soundEffects[i];
          const sfxTimestamp = Math.round((scene.startTimeSec + 0.8 + i * 1.5) * 10) / 10;
          const sfxPath = path.join(audioDir, `sfx_${sfxName}.wav`);

          if (!fs.existsSync(sfxPath)) {
            // Generate short crisp sound effect stem (1.5s)
            fs.writeFileSync(sfxPath, createMockWavAudio(1.5, 350));
          }

          sfxCues.push({
            id: `sfx-${scene.id}-${i}`,
            sceneId: scene.id,
            effectName: sfxName,
            timestampSec: Math.min(sfxTimestamp, scene.startTimeSec + scene.durationSec - 1),
            durationSec: 1.5,
            volume: 0.20,
            audioPath: sfxPath
          });
        }
      }
    }

    return { musicCues, sfxCues };
  }
}

export const audioDesignService = new AudioDesignService();
