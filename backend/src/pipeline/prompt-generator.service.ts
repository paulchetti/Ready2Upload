import {
  StructuredPrompt,
  VisualDirective,
  AspectRatio,
  CharacterProfile,
  LocationProfile,
  ObjectProfile,
  StyleProfile,
  ContinuityManifest
} from '@ready2upload/shared';

export interface PromptGenerationInput {
  directive: VisualDirective;
  aspectRatio: AspectRatio;
  continuity?: ContinuityManifest;
  sceneNumber: number;
}

export class PromptGeneratorService {
  /**
   * Generates a multi-part, photorealistic prompt for Image Generation models.
   */
  public generateImagePrompt(input: PromptGenerationInput): StructuredPrompt {
    const { directive, aspectRatio, continuity } = input;

    // Resolve character continuity
    let characterContext = '';
    if (directive.characterId && continuity?.characters) {
      const char = continuity.characters.find((c) => c.id === directive.characterId);
      if (char) {
        characterContext = `Character consistency: ${char.name}, age ${char.age || 'mature'}, wearing ${char.clothing}, appearance: ${char.physicalAppearance}. ${char.visualStyle}.`;
      }
    }

    // Resolve location continuity
    let locationContext = '';
    if (directive.locationId && continuity?.locations) {
      const loc = continuity.locations.find((l) => l.id === directive.locationId);
      if (loc) {
        locationContext = `Location consistency: ${loc.name}, environment: ${loc.environment}, architecture: ${loc.architecturalStyle}, era: ${loc.timePeriod}, ambient lighting: ${loc.lighting}.`;
      }
    }

    // Resolve object continuity
    let objectContext = '';
    if (directive.objectId && continuity?.objects) {
      const obj = continuity.objects.find((o) => o.id === directive.objectId);
      if (obj) {
        objectContext = `Object consistency: ${obj.name}, appearance: ${obj.appearance}, material: ${obj.material}.`;
      }
    }

    // Resolve style profile
    let styleContext = directive.colorStyle || 'Photorealistic historical documentary reconstruction';
    if (directive.styleId && continuity?.styles) {
      const st = continuity.styles.find((s) => s.id === directive.styleId);
      if (st) {
        styleContext = `${st.overallAesthetic}, palette: ${st.palette}, lens: ${st.lensCharacteristics}, grain: ${st.grain}`;
      }
    }

    const continuityText = [characterContext, locationContext, objectContext].filter(Boolean).join(' ') ||
      (input.sceneNumber > 1 ? `Visual continuity with preceding scene visual style and lighting.` : 'Establishing master visual sequence.');

    const promptObj: StructuredPrompt = {
      subject: directive.subjects,
      environment: directive.environment,
      action: directive.action,
      composition: `${directive.cameraPerspective}, cinematic depth of field`,
      camera: directive.cameraPerspective.includes('lens') ? directive.cameraPerspective : `${directive.cameraPerspective}, 35mm anamorphic prime lens, sharp focal plane`,
      lighting: directive.lighting,
      mood: directive.mood,
      style: styleContext,
      aspectRatio,
      continuity: continuityText,
      fullPrompt: [
        `SUBJECT: ${directive.subjects}`,
        `ENVIRONMENT: ${directive.environment}`,
        `ACTION: ${directive.action}`,
        `COMPOSITION & CAMERA: ${directive.cameraPerspective}`,
        `LIGHTING: ${directive.lighting}`,
        `MOOD: ${directive.mood}`,
        `STYLE: ${styleContext}`,
        `ASPECT RATIO: ${aspectRatio}`,
        `CONTINUITY: ${continuityText}`
      ].join(' | ')
    };

    return promptObj;
  }

  /**
   * Generates an action-dense, temporal prompt for Video Generation models.
   */
  public generateVideoPrompt(input: PromptGenerationInput): StructuredPrompt {
    const { directive, aspectRatio, continuity } = input;

    let continuitySummary = '';
    if (directive.characterId && continuity?.characters) {
      const char = continuity.characters.find((c) => c.id === directive.characterId);
      if (char) continuitySummary += `Exact character ${char.name} (${char.clothing}). `;
    }
    if (directive.locationId && continuity?.locations) {
      const loc = continuity.locations.find((l) => l.id === directive.locationId);
      if (loc) continuitySummary += `Location: ${loc.name}. `;
    }

    const fullPrompt = [
      `Cinematic shot of ${directive.subjects} in ${directive.environment}.`,
      `Motion and action: ${directive.action}.`,
      `Camera movement: ${directive.cameraPerspective}.`,
      `Atmospheric lighting: ${directive.lighting}.`,
      `Documentary tone: ${directive.mood}.`,
      `High-fidelity physics, realistic motion, 4k cinematic documentary reconstruction, stable camera tracking, no jitter.`,
      continuitySummary ? `Continuity: ${continuitySummary}` : ''
    ].filter(Boolean).join(' ');

    return {
      subject: directive.subjects,
      environment: directive.environment,
      action: directive.action,
      composition: directive.cameraPerspective,
      camera: directive.cameraPerspective,
      lighting: directive.lighting,
      mood: directive.mood,
      style: directive.colorStyle || 'Cinematic documentary 4K footage',
      aspectRatio,
      continuity: continuitySummary || undefined,
      fullPrompt
    };
  }
}

export const promptGeneratorService = new PromptGeneratorService();
