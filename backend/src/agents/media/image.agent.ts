import { BaseAgent } from '../base.agent';
import { AgentName, Scene, Project, Asset } from '@ready2upload/shared';
import { assetRepository } from '../../db/asset.repository';
import { sceneRepository } from '../../db/scene.repository';
import { costRepository } from '../../db/blueprint.repository';
import { storageService } from '../../storage/storage.service';
import { ProviderFactory } from '../../providers/provider.factory';
import crypto from 'crypto';

export class ImageAgent extends BaseAgent {
  public readonly name: AgentName = 'ImageAgent';

  public async run(project: Project, scenes: Scene[]): Promise<Asset[]> {
    return this.executeTask(
      project.id,
      'GENERATE_SCENE_IMAGES',
      `Generating visuals for ${scenes.length} storyboard scenes`,
      async (_task, reportProgress) => {
        const imageProvider = ProviderFactory.getImageProvider();
        const generatedAssets: Asset[] = [];

        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          const progressPercent = Math.round(((i + 1) / scenes.length) * 90);
          reportProgress(progressPercent, `Generating image for Scene ${scene.sceneNumber}/${scenes.length}...`);

          const prompt = `${scene.visualPrompt}, ${project.visualStyle}, cinematic lighting, photorealistic, 8k resolution, highly detailed`;

          const { buffer, mimeType, width, height, costUsd } = await imageProvider.generateImage(prompt, {
            aspectRatio: project.aspectRatio,
            style: project.visualStyle
          });

          const fileName = `scene_${String(scene.sceneNumber).padStart(2, '0')}.png`;
          const relativePath = `assets/images/${fileName}`;

          // Write file to disk
          const fullPath = storageService.writeProjectFile(project.id, relativePath, buffer);

          // Calculate SHA-256 checksum
          const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

          // Record in DB
          const asset = assetRepository.create({
            projectId: project.id,
            sceneId: scene.id,
            assetType: 'IMAGE',
            provider: imageProvider.name,
            model: 'image-gen',
            prompt,
            filePath: fullPath,
            fileName,
            mimeType,
            fileSizeBytes: buffer.length,
            resolution: `${width}x${height}`,
            costUsd,
            checksum
          });

          // Link asset to scene
          sceneRepository.update(scene.id, { imageAssetId: asset.id });

          costRepository.recordCost({
            projectId: project.id,
            provider: imageProvider.name,
            model: 'image-gen',
            operation: `GENERATE_IMAGE_SCENE_${scene.sceneNumber}`,
            costUsd
          });

          generatedAssets.push(asset);
        }

        reportProgress(100, `Successfully generated ${generatedAssets.length} scene images.`);
        return generatedAssets;
      }
    );
  }
}

export const imageAgent = new ImageAgent();
