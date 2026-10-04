import { BaseAgent } from '../base.agent';
import { AgentName, Scene, Project } from '@ready2upload/shared';
import { storageService } from '../../storage/storage.service';

export interface SubtitleDeliverables {
  srtPath: string;
  vttPath: string;
  srtContent: string;
  vttContent: string;
}

export class SubtitleAgent extends BaseAgent {
  public readonly name: AgentName = 'SubtitleAgent';

  public async run(project: Project, scenes: Scene[]): Promise<SubtitleDeliverables> {
    return this.executeTask(
      project.id,
      'GENERATE_SUBTITLES',
      `Generating SRT and VTT subtitles for ${scenes.length} scenes`,
      async (_task, reportProgress) => {
        reportProgress(20, 'Aligning scene narration timestamps...');

        const srtEntries: string[] = [];
        const vttEntries: string[] = ['WEBVTT\n'];

        let entryIndex = 1;

        for (const scene of scenes) {
          const startTimeSec = scene.startTimeSec;
          const endTimeSec = scene.startTimeSec + scene.durationSec;

          const srtTime = `${formatSrtTime(startTimeSec)} --> ${formatSrtTime(endTimeSec)}`;
          const vttTime = `${formatVttTime(startTimeSec)} --> ${formatVttTime(endTimeSec)}`;

          // Wrap text neatly if long
          const text = scene.narrationText.trim();

          srtEntries.push(`${entryIndex}\n${srtTime}\n${text}\n`);
          vttEntries.push(`${vttTime}\n${text}\n`);

          entryIndex++;
        }

        const srtContent = srtEntries.join('\n');
        const vttContent = vttEntries.join('\n');

        reportProgress(70, 'Writing subtitles.srt and subtitles.vtt...');

        const srtPath = storageService.writeProjectFile(project.id, 'content/subtitles.srt', srtContent);
        const vttPath = storageService.writeProjectFile(project.id, 'content/subtitles.vtt', vttContent);

        reportProgress(100, `Generated subtitles: ${scenes.length} synchronized subtitle cues.`);

        return { srtPath, vttPath, srtContent, vttContent };
      }
    );
  }
}

function formatSrtTime(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  const millis = Math.floor((totalSec % 1) * 1000);

  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');
  const ms = String(millis).padStart(3, '0');

  return `${h}:${m}:${s},${ms}`;
}

function formatVttTime(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  const millis = Math.floor((totalSec % 1) * 1000);

  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');
  const ms = String(millis).padStart(3, '0');

  return `${h}:${m}:${s}.${ms}`;
}

export const subtitleAgent = new SubtitleAgent();
