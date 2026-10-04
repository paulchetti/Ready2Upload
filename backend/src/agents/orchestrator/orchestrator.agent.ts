import { Project, ProjectStatus, ResearchDossier, ContentBlueprint, Scene, Asset, QualityReport, ProjectExport } from '@ready2upload/shared';
import { projectRepository } from '../../db/project.repository';
import { blueprintRepository, qaRepository, costRepository } from '../../db/blueprint.repository';
import { sceneRepository } from '../../db/scene.repository';
import { assetRepository } from '../../db/asset.repository';
import { researchAgent } from '../research/research.agent';
import { creativeAgent } from '../creative/creative.agent';
import { storyboardAgent } from '../storyboard/storyboard.agent';
import { imageAgent } from '../media/image.agent';
import { voiceAgent } from '../media/voice.agent';
import { subtitleAgent } from '../subtitles/subtitle.agent';
import { thumbnailAgent } from '../thumbnail/thumbnail.agent';
import { videoEditingAgent } from '../editing/video-editing.agent';
import { qaAgent } from '../qa/qa.agent';
import { exportAgent } from '../export/export.agent';
import { audioDesignService } from '../../pipeline/audio-design.service';
import { timelineService } from '../../pipeline/timeline.service';
import { eventBus } from './event-bus';

export class OrchestratorAgent {
  private activeJobs = new Map<string, boolean>();

  public isProjectActive(projectId: string): boolean {
    return this.activeJobs.get(projectId) === true;
  }

  public pausePipeline(projectId: string): void {
    this.activeJobs.set(projectId, false);
    projectRepository.updateStatus(projectId, 'PAUSED', 'Paused by user request');
    eventBus.emitEvent({
      type: 'PROJECT_STATUS_CHANGED',
      projectId,
      status: 'PAUSED',
      message: 'Workflow paused by user',
      timestamp: new Date().toISOString()
    });
  }

  public async startOrResumePipeline(projectId: string): Promise<void> {
    const project = projectRepository.findById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (this.isProjectActive(projectId)) {
      return; // Already running
    }

    this.activeJobs.set(projectId, true);

    try {
      await this.runStateMachine(project);
    } catch (err: any) {
      this.activeJobs.set(projectId, false);
      projectRepository.updateStatus(projectId, 'FAILED', 'Workflow execution halted due to error', err.message);
      eventBus.emitEvent({
        type: 'PROJECT_STATUS_CHANGED',
        projectId,
        status: 'FAILED',
        message: err.message,
        timestamp: new Date().toISOString()
      });
      throw err;
    } finally {
      this.activeJobs.set(projectId, false);
    }
  }

  private async runStateMachine(project: Project): Promise<void> {
    const shouldContinue = () => this.activeJobs.get(project.id) !== false;

    // Budget Watchdog check
    const checkBudget = () => {
      const { totalUsd } = costRepository.getProjectCost(project.id);
      if (totalUsd > project.maxBudgetUsd) {
        this.pausePipeline(project.id);
        throw new Error(`Project exceeded maximum budget ceiling of $${project.maxBudgetUsd.toFixed(2)} (Spent: $${totalUsd.toFixed(2)})`);
      }
    };

    let research: ResearchDossier | undefined = blueprintRepository.getResearch(project.id);
    let blueprint: ContentBlueprint | undefined = blueprintRepository.getBlueprint(project.id);
    let scenes: Scene[] = sceneRepository.findByProject(project.id);
    let assets: Asset[] = assetRepository.findByProject(project.id);
    let qualityReport: QualityReport | undefined = qaRepository.getReport(project.id);

    // -------------------------------------------------------------
    // Step 1: Research
    // -------------------------------------------------------------
    if (!research) {
      if (!shouldContinue()) return;
      checkBudget();
      projectRepository.updateStatus(project.id, 'RESEARCHING', 'Research Agent investigating sources and claims');
      eventBus.emitEvent({
        type: 'PROJECT_STATUS_CHANGED',
        projectId: project.id,
        status: 'RESEARCHING',
        message: 'Research Agent gathering facts and references',
        timestamp: new Date().toISOString()
      });

      research = await researchAgent.run(project);
    }

    // -------------------------------------------------------------
    // Step 2: Creative & Scripting
    // -------------------------------------------------------------
    if (!blueprint) {
      if (!shouldContinue()) return;
      checkBudget();
      projectRepository.updateStatus(project.id, 'SCRIPTING', 'Creative Agent crafting narrative and script');
      eventBus.emitEvent({
        type: 'PROJECT_STATUS_CHANGED',
        projectId: project.id,
        status: 'SCRIPTING',
        message: 'Creative Agent writing script and hooks',
        timestamp: new Date().toISOString()
      });

      blueprint = await creativeAgent.run(project, research);
    }

    // -------------------------------------------------------------
    // Step 3: Storyboarding
    // -------------------------------------------------------------
    if (scenes.length === 0) {
      if (!shouldContinue()) return;
      checkBudget();
      projectRepository.updateStatus(project.id, 'STORYBOARDING', 'Storyboard Agent designing scene timeline');
      eventBus.emitEvent({
        type: 'PROJECT_STATUS_CHANGED',
        projectId: project.id,
        status: 'STORYBOARDING',
        message: 'Storyboard Agent generating scene breakdown',
        timestamp: new Date().toISOString()
      });

      scenes = await storyboardAgent.run(project, blueprint);
    }

    // -------------------------------------------------------------
    // Step 4: Media Generation (Images, Voice, Subtitles, Thumbnail)
    // -------------------------------------------------------------
    const images = assets.filter((a) => a.assetType === 'IMAGE');
    const audio = assets.filter((a) => a.assetType === 'AUDIO');
    const thumbnail = assets.find((a) => a.assetType === 'THUMBNAIL');

    if (images.length < scenes.length || audio.length < scenes.length || !thumbnail) {
      if (!shouldContinue()) return;
      checkBudget();
      projectRepository.updateStatus(project.id, 'GENERATING_MEDIA', 'Media Agents generating visual and voice assets');
      eventBus.emitEvent({
        type: 'PROJECT_STATUS_CHANGED',
        projectId: project.id,
        status: 'GENERATING_MEDIA',
        message: 'Generating scene imagery, narration stems, and thumbnail',
        timestamp: new Date().toISOString()
      });

      // 4a. Images
      if (images.length < scenes.length) {
        const newImages = await imageAgent.run(project, scenes);
        assets.push(...newImages);
      }

      // 4b. Voice Narration
      if (audio.length < scenes.length) {
        const voiceResult = await voiceAgent.run(project, scenes);
        assets.push(...voiceResult.assets);
        // Refresh scenes because VoiceAgent updates their exact audio durations
        scenes = sceneRepository.findByProject(project.id);
      }

      // 4c. Subtitles (SRT & VTT)
      await subtitleAgent.run(project, scenes);

      // 4d. Thumbnail
      if (!thumbnail) {
        const thumbAsset = await thumbnailAgent.run(project, blueprint);
        assets.push(thumbAsset);
      }

      // 4e. Audio Design (Music scoring & SFX placement)
      const totalDuration = scenes.reduce((sum, s) => sum + s.durationSec, 0);
      const audioPlan = audioDesignService.createAudioPlan(project.id, scenes, totalDuration);

      // 4f. Master Multi-Track Timeline Assembly
      timelineService.buildTimeline(project, scenes, assets, audioPlan);
    }

    // -------------------------------------------------------------
    // Step 5: Video Editing & FFmpeg Rendering
    // -------------------------------------------------------------
    let finalVideo = assets.find((a) => a.assetType === 'VIDEO');
    if (!finalVideo) {
      if (!shouldContinue()) return;
      checkBudget();
      projectRepository.updateStatus(project.id, 'EDITING', 'Video Editing Agent assembling timeline and rendering MP4');
      eventBus.emitEvent({
        type: 'PROJECT_STATUS_CHANGED',
        projectId: project.id,
        status: 'EDITING',
        message: 'Rendering video with motion effects, audio mixing, and encoding',
        timestamp: new Date().toISOString()
      });

      finalVideo = await videoEditingAgent.run(project, scenes, assets);
      assets.push(finalVideo);
    }

    // -------------------------------------------------------------
    // Step 6: Quality Control (QA)
    // -------------------------------------------------------------
    if (!qualityReport) {
      if (!shouldContinue()) return;
      projectRepository.updateStatus(project.id, 'QA_CHECK', 'QA Agent running 15-point verification audit');
      eventBus.emitEvent({
        type: 'PROJECT_STATUS_CHANGED',
        projectId: project.id,
        status: 'QA_CHECK',
        message: 'Auditing audio-visual sync, asset coverage, and duration compliance',
        timestamp: new Date().toISOString()
      });

      qualityReport = await qaAgent.run(project, blueprint, scenes, assets, finalVideo);
    }

    // -------------------------------------------------------------
    // Step 7: Packaging & Export (Download Center)
    // -------------------------------------------------------------
    if (!shouldContinue()) return;
    projectRepository.updateStatus(project.id, 'REVIEW', 'Export Agent packaging deliverables and ZIP archive');

    const exportPackage = await exportAgent.run(project, blueprint, qualityReport, assets);

    // Final Status based on Autonomy Level
    const finalStatus: ProjectStatus = 'READY';
    projectRepository.updateStatus(
      project.id,
      finalStatus,
      'Production complete. Deliverable package ready in Download Center.'
    );

    eventBus.emitEvent({
      type: 'PROJECT_STATUS_CHANGED',
      projectId: project.id,
      status: finalStatus,
      message: 'All assets rendered and packaged. Ready for manual creator download.',
      data: exportPackage,
      timestamp: new Date().toISOString()
    });
  }
}

export const orchestratorAgent = new OrchestratorAgent();
