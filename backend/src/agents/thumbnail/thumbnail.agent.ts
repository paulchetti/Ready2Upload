import { BaseAgent } from '../base.agent';
import { AgentName, Project, ContentBlueprint, Asset } from '@ready2upload/shared';
import { assetRepository } from '../../db/asset.repository';
import { costRepository } from '../../db/blueprint.repository';
import { storageService } from '../../storage/storage.service';
import { ProviderFactory } from '../../providers/provider.factory';
import crypto from 'crypto';

export class ThumbnailAgent extends BaseAgent {
  public readonly name: AgentName = 'ThumbnailAgent';

  public async run(project: Project, blueprint: ContentBlueprint): Promise<Asset> {
    return this.executeTask(
      project.id,
      'GENERATE_THUMBNAIL',
      `Designing high-impact CTR thumbnail for: ${project.title}`,
      async (_task, reportProgress) => {
        reportProgress(20, 'Analyzing primary hook and selecting thumbnail composition...');

        const imageProvider = ProviderFactory.getImageProvider();

        const concept = blueprint.thumbnailConcepts[0] || {
          concept: 'Cinematic wide dramatic view of topic',
          visualPrompt: `${project.title}, high contrast, dramatic volumetric lighting, cinematic masterpiece`,
          textOverlay: 'UNVEILED'
        };

        const prompt = `${concept.visualPrompt}, bold YouTube thumbnail style, high contrast, vibrant colors, photorealistic, 8k resolution, centered subject, masterpiece`;

        reportProgress(50, 'Rendering thumbnail visual backdrop...');

        const { buffer, mimeType, width, height, costUsd } = await imageProvider.generateImage(prompt, {
          aspectRatio: project.aspectRatio === '9:16' ? '9:16' : '16:9',
          style: project.visualStyle
        });

        reportProgress(80, 'Saving thumbnail.png and registering asset...');

        const fileName = 'thumbnail.png';
        const fullPath = storageService.writeProjectFile(project.id, `content/${fileName}`, buffer);

        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

        const asset = assetRepository.create({
          projectId: project.id,
          assetType: 'THUMBNAIL',
          provider: imageProvider.name,
          model: 'thumbnail-composer',
          prompt,
          filePath: fullPath,
          fileName,
          mimeType,
          fileSizeBytes: buffer.length,
          resolution: `${width}x${height}`,
          costUsd,
          checksum
        });

        costRepository.recordCost({
          projectId: project.id,
          provider: imageProvider.name,
          model: 'thumbnail-composer',
          operation: 'GENERATE_THUMBNAIL',
          costUsd
        });

        reportProgress(100, `Thumbnail generated successfully (${width}x${height}).`);

        return asset;
      }
    );
  }
}

export const thumbnailAgent = new ThumbnailAgent();
