import { BaseAgent } from '../base.agent';
import { AgentName, Scene, ContentBlueprint, Project } from '@ready2upload/shared';
import { sceneRepository } from '../../db/scene.repository';
import { costRepository } from '../../db/blueprint.repository';
import { storageService } from '../../storage/storage.service';
import { ProviderFactory } from '../../providers/provider.factory';
import { visualDirectorAgent } from '../visual-director/visual-director.agent';

export class StoryboardAgent extends BaseAgent {
  public readonly name: AgentName = 'StoryboardAgent';

  public async run(project: Project, blueprint: ContentBlueprint): Promise<Scene[]> {
    return this.executeTask(
      project.id,
      'GENERATE_STORYBOARD',
      `Deconstructing script into scene-by-scene storyboard for: ${project.title}`,
      async (_task, reportProgress) => {
        reportProgress(15, 'Segmenting script into temporal scene blocks...');

        const llm = ProviderFactory.getLLMProvider();

        const prompt = `You are an expert video director and storyboard architect.
Break down the following narration script into a sequential timeline of scenes.

Project Format: ${project.contentType}
Aspect Ratio: ${project.aspectRatio}
Target Total Duration: ${project.targetDurationSec} seconds
Visual Style: ${project.visualStyle}

Full Script:
"${blueprint.scriptBody}"

Rules for Storyboard Breakdown:
1. Each scene must last between 5 and 15 seconds based on narration pacing.
2. The sum of all scene durations should roughly equal ${project.targetDurationSec}s.
3. Every scene MUST specify detailed visual concept, subjects, environment, lighting, and action.
4. Specify mediaType: 'IMAGE_ONLY' | 'VIDEO_CLIP' | 'TEXT_GRAPHIC' | 'MAP' | 'DIAGRAM'.
5. Provide high-contrast text overlay phrases (2-4 words) suitable for on-screen lower thirds.
6. Specify transition: 'fade' | 'crossfade' | 'cut' | 'dissolve'.`;

        const schema = `Array<
  {
    "sceneNumber": 1,
    "startTimeSec": 0,
    "durationSec": 8,
    "narrationText": "exact sentence spoken during this scene",
    "visualPrompt": "detailed cinematic visual generation prompt",
    "mediaType": "IMAGE_ONLY | VIDEO_CLIP | TEXT_GRAPHIC | MAP | DIAGRAM",
    "textOverlay": "SHORT TEXT",
    "transition": "fade | crossfade | cut | dissolve"
  }
>`;

        reportProgress(40, 'Synthesizing scene descriptions and temporal pacing...');

        const { data: rawScenesResult, tokensUsed, costUsd } = await llm.generateJSON<any>(
          prompt,
          `StoryboardScenes: ${schema}`
        );

        const rawScenes: Omit<Scene, 'id' | 'projectId'>[] = Array.isArray(rawScenesResult)
          ? rawScenesResult
          : (rawScenesResult?.scenes || Object.values(rawScenesResult || {})[0] || []);

        // Ensure scenes have progressive start times
        let currentStart = 0;
        const normalizedScenes = rawScenes.map((s, index) => {
          const duration = Math.max(3, Math.round(s.durationSec || 6));
          const scene = {
            ...s,
            sceneNumber: index + 1,
            startTimeSec: currentStart,
            durationSec: duration,
            mediaType: s.mediaType || 'IMAGE_ONLY',
            transition: s.transition || 'crossfade'
          };
          currentStart += duration;
          return scene;
        });

        costRepository.recordCost({
          projectId: project.id,
          provider: llm.name,
          model: 'llm',
          operation: 'STORYBOARD_GENERATION',
          tokensUsed,
          costUsd
        });

        reportProgress(70, 'Persisting raw scenes and invoking Visual Director Agent...');

        // Persist initial breakdown to SQLite
        const savedScenes = sceneRepository.createBatch(project.id, normalizedScenes);

        // Invoke Visual Director Agent to build Continuity Profiles and Structured Prompts
        const visualResult = await visualDirectorAgent.run(project, blueprint, savedScenes);

        reportProgress(
          100,
          `Storyboard and Visual Direction complete: ${visualResult.scenes.length} scenes directed with continuity profiles.`
        );

        return visualResult.scenes;
      }
    );
  }
}

export const storyboardAgent = new StoryboardAgent();
