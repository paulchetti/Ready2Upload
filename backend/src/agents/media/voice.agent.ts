import { BaseAgent } from '../base.agent';
import { AgentName, Scene, Project, Asset } from '@ready2upload/shared';
import { WordTimestamp } from '../../providers/provider.interface';
import { assetRepository } from '../../db/asset.repository';
import { sceneRepository } from '../../db/scene.repository';
import { costRepository } from '../../db/blueprint.repository';
import { storageService } from '../../storage/storage.service';
import { ProviderFactory } from '../../providers/provider.factory';
import crypto from 'crypto';

export interface VoiceGenerationResult {
  assets: Asset[];
  sceneTimestamps: Map<number, WordTimestamp[]>;
}

export class VoiceAgent extends BaseAgent {
  public readonly name: AgentName = 'VoiceAgent';

  public async run(project: Project, scenes: Scene[]): Promise<VoiceGenerationResult> {
    return this.executeTask(
      project.id,
      'GENERATE_VOICE_NARRATION',
      `Synthesizing voice narration for ${scenes.length} scenes`,
      async (_task, reportProgress) => {
        const voiceProvider = ProviderFactory.getVoiceProvider();
        const generatedAssets: Asset[] = [];
        const sceneTimestamps = new Map<number, WordTimestamp[]>();

        let cumulativeTime = 0;

        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          const progressPercent = Math.round(((i + 1) / scenes.length) * 90);
          reportProgress(progressPercent, `Synthesizing narration for Scene ${scene.sceneNumber}/${scenes.length}...`);

          const { audioBuffer, durationSec, mimeType, timestamps, costUsd } = await voiceProvider.generateSpeech(
            scene.narrationText,
            {
              voiceId: project.voiceId,
              language: project.language,
              tone: project.tone
            }
          );

          const fileName = `narration_scene_${String(scene.sceneNumber).padStart(2, '0')}.wav`;
          const relativePath = `assets/audio/${fileName}`;

          // Write audio stem to disk
          const fullPath = storageService.writeProjectFile(project.id, relativePath, audioBuffer);

          const checksum = crypto.createHash('sha256').update(audioBuffer).digest('hex');

          // Record asset
          const asset = assetRepository.create({
            projectId: project.id,
            sceneId: scene.id,
            assetType: 'AUDIO',
            provider: voiceProvider.name,
            model: 'tts-engine',
            prompt: scene.narrationText,
            filePath: fullPath,
            fileName,
            mimeType,
            fileSizeBytes: audioBuffer.length,
            durationSec,
            costUsd,
            checksum
          });

          // Precision timing synchronization:
          // Update scene duration and start time to match the real spoken audio length
          sceneRepository.update(scene.id, {
            audioStemId: asset.id,
            durationSec: Math.max(3, Math.ceil(durationSec)),
            startTimeSec: cumulativeTime
          });

          cumulativeTime += Math.max(3, Math.ceil(durationSec));

          costRepository.recordCost({
            projectId: project.id,
            provider: voiceProvider.name,
            model: 'tts-engine',
            operation: `GENERATE_VOICE_SCENE_${scene.sceneNumber}`,
            costUsd
          });

          if (timestamps) {
            sceneTimestamps.set(scene.sceneNumber, timestamps);
          }

          generatedAssets.push(asset);
        }

        reportProgress(100, `Voice synthesis complete for all ${scenes.length} scenes.`);
        return { assets: generatedAssets, sceneTimestamps };
      }
    );
  }
}

export const voiceAgent = new VoiceAgent();
