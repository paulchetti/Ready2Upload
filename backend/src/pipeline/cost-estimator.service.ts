import { Project } from '@ready2upload/shared';

export interface ProductionCostEstimate {
  estimatedScenes: number;
  estimatedImages: number;
  estimatedVideoClips: number;
  estimatedVoiceDurationSec: number;
  estimatedLlmCostUsd: number;
  estimatedImageCostUsd: number;
  estimatedVoiceCostUsd: number;
  estimatedVideoCostUsd: number;
  totalEstimatedCostUsd: number;
  budgetCeilingUsd: number;
  isWithinBudget: boolean;
}

export class CostEstimatorService {
  /**
   * Pre-calculates projected production cost before triggering media generators.
   */
  public estimateProductionCost(project: Project): ProductionCostEstimate {
    const targetDurationSec = project.targetDurationSec || 60;

    // Approximately 1 scene every 6-8 seconds
    const estimatedScenes = Math.max(3, Math.ceil(targetDurationSec / 7));

    // Assume 80% images, 20% video clips in standard documentary configuration
    const estimatedVideoClips = Math.floor(estimatedScenes * 0.2);
    const estimatedImages = estimatedScenes - estimatedVideoClips;

    // Standard provider rates
    const costPerImage = 0.02; // $0.02 per generated image
    const costPerVideoClip = 0.08; // $0.08 per 5s video clip
    const costPerMinuteVoice = 0.015; // ElevenLabs/Gemini voice estimation
    const estimatedLlmCost = 0.01; // Research + Creative + Visual Director LLM calls

    const estimatedImageCostUsd = Math.round(estimatedImages * costPerImage * 1000) / 1000;
    const estimatedVideoCostUsd = Math.round(estimatedVideoClips * costPerVideoClip * 1000) / 1000;
    const estimatedVoiceCostUsd = Math.round((targetDurationSec / 60) * costPerMinuteVoice * 1000) / 1000;

    const totalEstimatedCostUsd =
      Math.round((estimatedLlmCost + estimatedImageCostUsd + estimatedVideoCostUsd + estimatedVoiceCostUsd) * 100) / 100;

    const budgetCeilingUsd = project.maxBudgetUsd || 10.0;
    const isWithinBudget = totalEstimatedCostUsd <= budgetCeilingUsd;

    return {
      estimatedScenes,
      estimatedImages,
      estimatedVideoClips,
      estimatedVoiceDurationSec: targetDurationSec,
      estimatedLlmCostUsd: estimatedLlmCost,
      estimatedImageCostUsd,
      estimatedVoiceCostUsd,
      estimatedVideoCostUsd,
      totalEstimatedCostUsd,
      budgetCeilingUsd,
      isWithinBudget
    };
  }
}

export const costEstimatorService = new CostEstimatorService();
