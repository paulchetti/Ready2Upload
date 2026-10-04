import { BaseAgent } from '../base.agent';
import {
  AgentName,
  Project,
  ContentBlueprint,
  Scene,
  VisualDirective,
  ContinuityManifest,
  CharacterProfile,
  LocationProfile,
  ObjectProfile,
  StyleProfile
} from '@ready2upload/shared';
import { sceneRepository } from '../../db/scene.repository';
import { continuityRepository } from '../../db/continuity.repository';
import { costRepository } from '../../db/blueprint.repository';
import { storageService } from '../../storage/storage.service';
import { ProviderFactory } from '../../providers/provider.factory';
import { mediaDecisionService } from '../../pipeline/media-decision.service';
import { promptGeneratorService } from '../../pipeline/prompt-generator.service';

export interface VisualDirectorResult {
  scenes: Scene[];
  manifest: ContinuityManifest;
}

export class VisualDirectorAgent extends BaseAgent {
  public readonly name: AgentName = 'VisualDirectorAgent';

  public async run(project: Project, blueprint: ContentBlueprint, initialScenes: Scene[]): Promise<VisualDirectorResult> {
    return this.executeTask(
      project.id,
      'VISUAL_DIRECTOR_PLAN',
      `Directing visual aesthetics, continuity profiles, and media decisions for: ${project.title}`,
      async (_task, reportProgress) => {
        reportProgress(10, 'Synthesizing character, location, and aesthetic continuity profiles...');

        const llm = ProviderFactory.getLLMProvider();

        // 1. Establish Continuity Profiles
        const continuityPrompt = `You are an elite cinema director and visual continuity supervisor for a high-end documentary film.
Analyze the topic and script, and extract key recurring characters, locations, key historical objects, and the master visual style.

Project Title: ${project.title}
Topic: ${project.topic}
Visual Style Preference: ${project.visualStyle}
Aspect Ratio: ${project.aspectRatio}

Script:
"${blueprint.scriptBody}"

Define:
1. Up to 3 main recurring Character Profiles (if applicable to documentary/history/topic)
2. Up to 3 primary Location Profiles
3. Up to 3 Key Object Profiles
4. 1 Master Style Profile (color palette, grain, camera lenses)`;

        const continuitySchema = `{
  "characters": [
    {
      "id": "char-1",
      "name": "Historical Figure or Merchant",
      "age": 42,
      "clothing": "detailed clothing description",
      "physicalAppearance": "distinctive visual features",
      "visualStyle": "period-accurate historical style"
    }
  ],
  "locations": [
    {
      "id": "loc-1",
      "name": "Primary Site or Landscape",
      "environment": "desert caravan route or archaeological trench",
      "architecturalStyle": "ancient masonry or natural terrain",
      "timePeriod": "historical era",
      "lighting": "warm sunset or harsh dawn light"
    }
  ],
  "objects": [
    {
      "id": "obj-1",
      "name": "Royal Cylinder or Artifact",
      "appearance": "etched clay or bronze artifact",
      "material": "baked clay with bitumen mortar",
      "details": "intricate cuneiform or ornate engravings"
    }
  ],
  "styles": [
    {
      "id": "style-1",
      "palette": "warm amber, deep desert ochre, and slate twilight",
      "grain": "fine 35mm cinematic film grain",
      "lensCharacteristics": "sharp center anamorphic with soft edge falloff",
      "overallAesthetic": "Prestige historical reconstruction documentary"
    }
  ]
}`;

        const { data: rawManifest, tokensUsed: t1, costUsd: c1 } = await llm.generateJSON<ContinuityManifest>(
          continuityPrompt,
          `ContinuityManifest: ${continuitySchema}`
        );

        const manifest: ContinuityManifest = {
          characters: rawManifest.characters || [],
          locations: rawManifest.locations || [],
          objects: rawManifest.objects || [],
          styles: rawManifest.styles || [
            {
              id: 'style-default',
              palette: 'rich cinematic color grading',
              grain: 'subtle film grain',
              lensCharacteristics: 'prime 35mm lens',
              overallAesthetic: project.visualStyle || 'Cinematic documentary'
            }
          ]
        };

        continuityRepository.saveProfiles(project.id, manifest);

        reportProgress(40, `Directing visual scenes and media requirements for ${initialScenes.length} scenes...`);

        // 2. Enhance each scene with Visual Directives and Prompts
        const enhancedScenes: Scene[] = [];

        for (let i = 0; i < initialScenes.length; i++) {
          const s = initialScenes[i];
          const sceneNum = i + 1;

          // Intelligently decide media type & animation
          const decision = mediaDecisionService.decide({
            scenePurpose: s.textOverlay || `Scene ${sceneNum} exposition`,
            narrationText: s.narrationText,
            actionDescription: s.visualPrompt,
            hasStatisticsOrData: s.narrationText.match(/\d+/) !== null,
            hasGeographicalContext: s.narrationText.toLowerCase().includes('route') || s.narrationText.toLowerCase().includes('map'),
            isActionHeavy: s.visualPrompt.toLowerCase().includes('battle') || s.visualPrompt.toLowerCase().includes('fast'),
            durationSec: s.durationSec
          });

          // Match continuity IDs
          const matchedChar = manifest.characters[i % Math.max(1, manifest.characters.length)];
          const matchedLoc = manifest.locations[i % Math.max(1, manifest.locations.length)];
          const matchedObj = manifest.objects[i % Math.max(1, manifest.objects.length)];
          const matchedStyle = manifest.styles[0];

          // Determine audio mood and SFX
          const soundEffects: string[] = [];
          if (s.narrationText.toLowerCase().includes('desert') || s.narrationText.toLowerCase().includes('sand')) {
            soundEffects.push('desert_wind_subtle');
          } else if (s.narrationText.toLowerCase().includes('brick') || s.narrationText.toLowerCase().includes('stone') || s.narrationText.toLowerCase().includes('excavat')) {
            soundEffects.push('chisel_on_stone');
          } else if (s.narrationText.toLowerCase().includes('city') || s.narrationText.toLowerCase().includes('workforce') || s.narrationText.toLowerCase().includes('tower')) {
            soundEffects.push('ambient_ancient_crowd');
          }

          const musicIntensity = sceneNum === 1
            ? 'building'
            : sceneNum === initialScenes.length
            ? 'triumphant'
            : (sceneNum % 2 === 0 ? 'tension' : 'reflective');

          const directive: VisualDirective = {
            scenePurpose: s.textOverlay || `Scene ${sceneNum} Narrative progression`,
            narrationSection: s.narrationText,
            visualConcept: s.visualPrompt,
            cameraPerspective: s.visualPrompt.toLowerCase().includes('macro')
              ? 'Extreme macro close-up, sharp selective focus'
              : 'Cinematic wide tracking shot, low-angle perspective',
            environment: matchedLoc?.environment || 'Epic documentary landscape',
            subjects: matchedChar?.name || 'Historical figures and atmospheric elements',
            action: `Deliberate cinematic movement reflecting: "${s.narrationText.slice(0, 80)}"`,
            lighting: matchedLoc?.lighting || 'Golden hour warm sunlight with volumetric rays',
            mood: project.tone || 'Epic, authoritative, and awe-inspiring',
            colorStyle: matchedStyle.palette,
            mediaRequirement: decision.mediaType,
            animationRequirement: decision.animationType,
            transition: s.transition || 'crossfade',
            textOverlay: s.textOverlay,
            soundEffects,
            musicIntensity,
            characterId: matchedChar?.id,
            locationId: matchedLoc?.id,
            objectId: matchedObj?.id,
            styleId: matchedStyle?.id
          };

          // Generate structured prompt
          const structuredPrompt = decision.mediaType === 'AI_VIDEO'
            ? promptGeneratorService.generateVideoPrompt({
                directive,
                aspectRatio: project.aspectRatio,
                continuity: manifest,
                sceneNumber: sceneNum
              })
            : promptGeneratorService.generateImagePrompt({
                directive,
                aspectRatio: project.aspectRatio,
                continuity: manifest,
                sceneNumber: sceneNum
              });

          const enhancedScene: Scene = {
            ...s,
            mediaType: decision.mediaType,
            animationType: decision.animationType,
            visualDirective: directive,
            structuredPrompt,
            visualPrompt: structuredPrompt.fullPrompt,
            soundEffects,
            musicIntensity,
            characterId: directive.characterId,
            locationId: directive.locationId,
            objectId: directive.objectId,
            styleId: directive.styleId
          };

          sceneRepository.update(enhancedScene.id, enhancedScene);
          enhancedScenes.push(enhancedScene);
        }

        costRepository.recordCost({
          projectId: project.id,
          provider: llm.name,
          model: 'visual-director',
          operation: 'VISUAL_DIRECTOR_PLAN',
          tokensUsed: t1,
          costUsd: c1
        });

        // Write enhanced storyboard to project storage
        storageService.writeProjectFile(
          project.id,
          'content/storyboard.json',
          JSON.stringify(enhancedScenes, null, 2)
        );

        storageService.writeProjectFile(
          project.id,
          'content/continuity_profiles.json',
          JSON.stringify(manifest, null, 2)
        );

        reportProgress(100, `Visual Director plan complete: ${enhancedScenes.length} scenes directed with continuity profiles.`);

        return { scenes: enhancedScenes, manifest };
      }
    );
  }
}

export const visualDirectorAgent = new VisualDirectorAgent();
