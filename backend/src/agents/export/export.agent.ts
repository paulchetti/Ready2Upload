import { BaseAgent } from '../base.agent';
import { AgentName, Project, ProjectExport, ContentBlueprint, QualityReport, Asset } from '@ready2upload/shared';
import { storageService } from '../../storage/storage.service';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

export class ExportAgent extends BaseAgent {
  public readonly name: AgentName = 'ExportAgent';

  public async run(
    project: Project,
    blueprint: ContentBlueprint,
    qualityReport: QualityReport,
    assets: Asset[]
  ): Promise<ProjectExport> {
    return this.executeTask(
      project.id,
      'CREATE_DOWNLOAD_PACKAGE',
      `Packaging deliverables and building ZIP package for: ${project.title}`,
      async (_task, reportProgress) => {
        reportProgress(10, 'Compiling project metadata and package manifest...');

        const projectDir = storageService.getProjectDir(project.id);

        // Generate metadata.json
        const metadata = {
          projectId: project.id,
          title: project.title,
          topic: project.topic,
          contentType: project.contentType,
          aspectRatio: project.aspectRatio,
          targetDurationSec: project.targetDurationSec,
          language: project.language,
          visualStyle: project.visualStyle,
          tone: project.tone,
          qaScore: qualityReport.score,
          qaStatus: qualityReport.overallStatus,
          exportedAt: new Date().toISOString(),
          assetsCount: assets.length
        };

        storageService.writeProjectFile(project.id, 'metadata.json', JSON.stringify(metadata, null, 2));

        // Generate README.md for creator
        const readmeContent = `# ${project.title} — Production Deliverable Package

> **Generated autonomously by Ready2Upload AI Content Production Studio**  
> *Ready for manual creator publishing to YouTube, Instagram, X, and other platforms.*

---

## 📦 Package Contents

1. **\`final_video.mp4\`**: Master rendered high-definition video (${project.aspectRatio} aspect ratio).
2. **\`thumbnail.png\`**: High-contrast, high-CTR thumbnail graphic.
3. **\`subtitles.srt\` & \`subtitles.vtt\`**: Synchronized subtitle tracks.
4. **\`script.md\`**: Complete narrative spoken script with word counts.
5. **\`storyboard.json\`**: Machine-readable scene-by-scene timing and prompt directives.
6. **\`research_notes.md\` & \`research_sources.json\`**: Academic sources and claim verification dossier.
7. **\`metadata.json\`**: Production run parameters and asset checksums.

---

## 🚀 Publishing Checklist

- [ ] Inspect \`final_video.mp4\` and review pacing.
- [ ] Select \`thumbnail.png\` as your video cover image.
- [ ] Upload \`subtitles.srt\` to your platform caption manager.
- [ ] Copy the video description and hook from \`script.md\`.
- [ ] Verify source citations from \`research_sources.json\` if citing factual claims.

*Notice: This package was created locally. The platform performs zero automated publishing; all distribution remains strictly under your control.*
`;

        storageService.writeProjectFile(project.id, 'README.md', readmeContent);

        reportProgress(40, 'Assembling ZIP bundle from deliverables...');

        const zipPath = path.join(projectDir, `${storageService.sanitizeFileName(project.title)}_package.zip`);

        await new Promise<void>((resolve, reject) => {
          const output = fs.createWriteStream(zipPath);
          const archive = archiver('zip', { zlib: { level: 6 } });

          output.on('close', () => resolve());
          archive.on('error', (err) => reject(err));

          archive.pipe(output);

          // Add final video if exists
          const videoPath = path.join(projectDir, 'renders', 'final_video.mp4');
          if (fs.existsSync(videoPath)) {
            archive.file(videoPath, { name: 'final_video.mp4' });
          }

          // Add thumbnail if exists
          const thumbPath = path.join(projectDir, 'content', 'thumbnail.png');
          if (fs.existsSync(thumbPath)) {
            archive.file(thumbPath, { name: 'thumbnail.png' });
          }

          // Add subtitles
          const srtPath = path.join(projectDir, 'content', 'subtitles.srt');
          if (fs.existsSync(srtPath)) archive.file(srtPath, { name: 'subtitles.srt' });

          const vttPath = path.join(projectDir, 'content', 'subtitles.vtt');
          if (fs.existsSync(vttPath)) archive.file(vttPath, { name: 'subtitles.vtt' });

          // Add script, storyboard, and research
          const scriptPath = path.join(projectDir, 'content', 'script.md');
          if (fs.existsSync(scriptPath)) archive.file(scriptPath, { name: 'script.md' });

          const sbPath = path.join(projectDir, 'content', 'storyboard.json');
          if (fs.existsSync(sbPath)) archive.file(sbPath, { name: 'storyboard.json' });

          const timelinePath = path.join(projectDir, 'content', 'timeline.json');
          if (fs.existsSync(timelinePath)) archive.file(timelinePath, { name: 'timeline.json' });

          const continuityPath = path.join(projectDir, 'content', 'continuity_profiles.json');
          if (fs.existsSync(continuityPath)) archive.file(continuityPath, { name: 'continuity_profiles.json' });

          const resNotes = path.join(projectDir, 'research', 'research_notes.md');
          if (fs.existsSync(resNotes)) archive.file(resNotes, { name: 'research_notes.md' });

          const resSources = path.join(projectDir, 'research', 'research_sources.json');
          if (fs.existsSync(resSources)) archive.file(resSources, { name: 'research_sources.json' });

          // Add metadata & README
          const metaPath = path.join(projectDir, 'metadata.json');
          if (fs.existsSync(metaPath)) archive.file(metaPath, { name: 'metadata.json' });

          const readmePath = path.join(projectDir, 'README.md');
          if (fs.existsSync(readmePath)) archive.file(readmePath, { name: 'README.md' });

          archive.finalize();
        });

        reportProgress(90, 'Validating ZIP archive integrity and size...');

        const zipStats = fs.statSync(zipPath);

        const projectExport: ProjectExport = {
          projectId: project.id,
          finalVideoPath: path.join(projectDir, 'renders', 'final_video.mp4'),
          thumbnailPath: path.join(projectDir, 'content', 'thumbnail.png'),
          subtitlesSrtPath: path.join(projectDir, 'content', 'subtitles.srt'),
          subtitlesVttPath: path.join(projectDir, 'content', 'subtitles.vtt'),
          scriptPath: path.join(projectDir, 'content', 'script.md'),
          researchPath: path.join(projectDir, 'research', 'research_notes.md'),
          sourcesPath: path.join(projectDir, 'research', 'research_sources.json'),
          zipPath,
          totalPackageSizeBytes: zipStats.size
        };

        reportProgress(100, `Download package compiled: ${Math.round(zipStats.size / 1024 / 1024 * 10) / 10} MB. Ready for download.`);

        return projectExport;
      }
    );
  }
}

export const exportAgent = new ExportAgent();
