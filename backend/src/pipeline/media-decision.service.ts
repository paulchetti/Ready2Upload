import { SceneMediaType, SceneAnimationType } from '@ready2upload/shared';

export interface MediaDecisionInput {
  scenePurpose: string;
  narrationText: string;
  actionDescription: string;
  hasStatisticsOrData: boolean;
  hasGeographicalContext: boolean;
  isActionHeavy: boolean;
  durationSec: number;
}

export interface MediaDecisionOutput {
  mediaType: SceneMediaType;
  animationType: SceneAnimationType;
  rationale: string;
}

export class MediaDecisionService {
  /**
   * Intelligently selects media type and camera animation for a scene,
   * balancing narrative impact, visual variety, and cost efficiency.
   */
  public decide(input: MediaDecisionInput): MediaDecisionOutput {
    const textLower = (input.narrationText + ' ' + input.actionDescription + ' ' + input.scenePurpose).toLowerCase();

    // 1. Geographic / Map indicators
    if (
      input.hasGeographicalContext ||
      textLower.includes('route') ||
      textLower.includes('territory') ||
      textLower.includes('continent') ||
      textLower.includes('geography') ||
      textLower.includes('map') ||
      textLower.includes('borders') ||
      textLower.includes('migration')
    ) {
      return {
        mediaType: 'MAP',
        animationType: 'slow_zoom_in',
        rationale: 'Geographical explanation accurately depicted via programmatic map visualization.'
      };
    }

    // 2. Statistical or Data indicators
    if (
      input.hasStatisticsOrData ||
      textLower.includes('percent') ||
      textLower.includes('data') ||
      textLower.includes('chart') ||
      textLower.includes('statistics') ||
      textLower.includes('numbers') ||
      textLower.includes('recorded in')
    ) {
      return {
        mediaType: 'TEXT_GRAPHIC',
        animationType: 'static',
        rationale: 'Accurate numerical/statistical presentation using structured typography.'
      };
    }

    // 3. High action or cinematic motion indicators (Battle, charging, storm, rapid movement)
    if (
      input.isActionHeavy ||
      textLower.includes('battle') ||
      textLower.includes('charging') ||
      textLower.includes('running') ||
      textLower.includes('explosion') ||
      textLower.includes('galloping') ||
      textLower.includes('storm raging') ||
      textLower.includes('collapsing')
    ) {
      return {
        mediaType: 'AI_VIDEO',
        animationType: 'motion_clip',
        rationale: 'High physical dynamism and action requires temporal video generation.'
      };
    }

    // 4. Diagram or Process flow indicators
    if (
      textLower.includes('mechanism') ||
      textLower.includes('engineering') ||
      textLower.includes('architecture plan') ||
      textLower.includes('blueprint') ||
      textLower.includes('cross-section')
    ) {
      return {
        mediaType: 'DIAGRAM',
        animationType: 'slow_zoom_out',
        rationale: 'Technical architectural schema requires precise diagrammatic rendering.'
      };
    }

    // 5. Default Documentary Standard: High-Impact Cinematic Imagery with Ken Burns Camera Motion
    // Alternate animations to keep viewer engagement high
    const animations: SceneAnimationType[] = ['slow_zoom_in', 'slow_zoom_out', 'pan_left', 'pan_right'];
    const selectedAnim = animations[Math.floor(Math.random() * animations.length)];

    return {
      mediaType: 'AI_IMAGE',
      animationType: selectedAnim,
      rationale: 'Cinematic visual composition with subtle camera motion maintains visual prestige without generative hallucination.'
    };
  }
}

export const mediaDecisionService = new MediaDecisionService();
