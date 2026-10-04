import { BaseAgent } from '../base.agent';
import { AgentName, Project, Scene, Asset } from '@ready2upload/shared';
import { assetRepository } from '../../db/asset.repository';
import { continuityRepository } from '../../db/continuity.repository';
import { storageService } from '../../storage/storage.service';
import { ffmpegService } from '../../pipeline/ffmpeg.service';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export class VideoEditingAgent extends BaseAgent {
  public readonly name: AgentName = 'VideoEditingAgent';

  public async run(project: Project, scenes: Scene[], assets: Asset[]): Promise<Asset> {
    return this.executeTask(
      project.id,
      'RENDER_FINAL_VIDEO',
      `Assembling and rendering full-length ${project.aspectRatio} video from ${scenes.length} directed scenes`,
      async (_task, reportProgress) => {
        reportProgress(10, 'Preparing timeline directives and setting render dimensions...');

        let width = 1920;
        let height = 1080;
        if (project.aspectRatio === '9:16') {
          width = 1080;
          height = 1920;
        } else if (project.aspectRatio === '1:1') {
          width = 1080;
          height = 1080;
        }

        const projectDir = storageService.getProjectDir(project.id);
        const tempScenesDir = path.join(projectDir, 'renders', 'scene_parts');
        storageService.ensureDirectory(tempScenesDir);

        const renderedSceneParts: string[] = [];

        // Map assets by scene ID
        const imagesByScene = new Map<string, Asset>();
        const audioByScene = new Map<string, Asset>();
        const videoClipsByScene = new Map<string, Asset>();

        for (const asset of assets) {
          if (asset.sceneId) {
            if (asset.assetType === 'IMAGE') imagesByScene.set(asset.sceneId, asset);
            if (asset.assetType === 'AUDIO') audioByScene.set(asset.sceneId, asset);
            if (asset.assetType === 'VIDEO') videoClipsByScene.set(asset.sceneId, asset);
          }
        }

        // Render each scene individually according to Visual Director directives
        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          const progressPercent = 10 + Math.round(((i + 1) / scenes.length) * 60);
          const animName = scene.animationType || 'slow_zoom_in';
          reportProgress(progressPercent, `Rendering Scene ${scene.sceneNumber}/${scenes.length} [${scene.mediaType}, ${animName}]...`);

          const audioAsset = audioByScene.get(scene.id);
          const imageAsset = imagesByScene.get(scene.id);

          if (!audioAsset) {
            throw new Error(`Missing audio narration for Scene ${scene.sceneNumber}.`);
          }

          const sceneOutputPath = path.join(
            tempScenesDir,
            `scene_${String(scene.sceneNumber).padStart(2, '0')}.mp4`
          );

          // If an AI video clip was already generated for this scene, use it
          const videoClip = videoClipsByScene.get(scene.id);
          if (videoClip && fs.existsSync(videoClip.filePath) && fs.statSync(videoClip.filePath).size > 1000) {
            renderedSceneParts.push(videoClip.filePath);
            continue;
          }

          // Fallback to Image with tailored Ken Burns animation
          const visualInputPath = imageAsset?.filePath;
          if (!visualInputPath || !fs.existsSync(visualInputPath)) {
            throw new Error(`Missing media for Scene ${scene.sceneNumber}: visual asset not found.`);
          }

          await ffmpegService.renderSceneVideo({
            imagePath: visualInputPath,
            audioPath: audioAsset.filePath,
            durationSec: scene.durationSec,
            outputPath: sceneOutputPath,
            width,
            height,
            fps: 30,
            animationType: scene.animationType || 'slow_zoom_in'
          });

          renderedSceneParts.push(sceneOutputPath);
        }

        reportProgress(75, 'Concatenating all rendered scenes into master video track...');

        const unmixedVideoPath = path.join(projectDir, 'renders', 'unmixed_master.mp4');
        await ffmpegService.concatenateScenes(renderedSceneParts, unmixedVideoPath);

        // Fetch master timeline to inspect music tracks
        const timeline = continuityRepository.getTimeline(project.id);
        const musicCues = timeline?.tracks?.music || [];

        let finalVideoPath = path.join(projectDir, 'renders', 'final_video.mp4');

        if (musicCues.length > 0 && musicCues[0].audioPath && fs.existsSync(musicCues[0].audioPath)) {
          reportProgress(85, 'Mixing ducked background music score beneath narration audio...');
          try {
            await ffmpegService.mixBackgroundMusic({
              videoInputPath: unmixedVideoPath,
              musicAudioPath: musicCues[0].audioPath,
              outputPath: finalVideoPath,
              musicVolume: musicCues[0].duckingLevel || 0.12
            });
          } catch (err: any) {
            console.warn('Audio mixing fallback to unmixed master:', err.message);
            fs.copyFileSync(unmixedVideoPath, finalVideoPath);
          }
        } else {
          fs.copyFileSync(unmixedVideoPath, finalVideoPath);
        }

        // Apply broadcast loudness normalization (-14 LUFS)
        reportProgress(90, 'Applying EBU R128 loudness normalization (-14 LUFS)...');
        const normalizedVideoPath = path.join(projectDir, 'renders', 'normalized_final.mp4');
        try {
          await ffmpegService.applyLoudnessNormalization(finalVideoPath, normalizedVideoPath);
          if (fs.existsSync(normalizedVideoPath) && fs.statSync(normalizedVideoPath).size > 1000) {
            fs.copyFileSync(normalizedVideoPath, finalVideoPath);
            fs.unlinkSync(normalizedVideoPath);
          }
        } catch (_err) {
          // If normalization filter fails, proceed with standard mixed final
        }

        // Create fast preview copy
        const previewVideoPath = path.join(projectDir, 'renders', 'preview.mp4');
        fs.copyFileSync(finalVideoPath, previewVideoPath);

        reportProgress(95, 'Registering master video asset and verifying checksum...');

        const stats = fs.statSync(finalVideoPath);
        const buffer = fs.readFileSync(finalVideoPath);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        const totalDuration = scenes.reduce((sum, s) => sum + s.durationSec, 0);

        const videoAsset = assetRepository.create({
          projectId: project.id,
          assetType: 'VIDEO',
          provider: 'ffmpeg-renderer',
          model: 'h264-aac-timeline-assembly',
          prompt: `Master timeline assembly of ${scenes.length} scenes with Ken Burns motion & ducked score`,
          filePath: finalVideoPath,
          fileName: 'final_video.mp4',
          mimeType: 'video/mp4',
          fileSizeBytes: stats.size,
          resolution: `${width}x${height}`,
          durationSec: totalDuration,
          costUsd: 0.0,
          checksum
        });

        reportProgress(100, `Video render complete: final_video.mp4 (${Math.round((stats.size / 1024 / 1024) * 10) / 10} MB, ${totalDuration}s)`);

        return videoAsset;
      }
    );
  }
}

export const videoEditingAgent = new VideoEditingAgent();
