import { Router, Request, Response } from 'express';
import { projectRepository } from '../db/project.repository';
import { sceneRepository } from '../db/scene.repository';
import { assetRepository } from '../db/asset.repository';
import { taskRepository } from '../db/task.repository';
import { blueprintRepository, qaRepository, costRepository } from '../db/blueprint.repository';
import { continuityRepository } from '../db/continuity.repository';
import { orchestratorAgent } from '../agents/orchestrator/orchestrator.agent';
import { eventBus } from '../agents/orchestrator/event-bus';
import { storageService } from '../storage/storage.service';
import { ProviderFactory } from '../providers/provider.factory';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const projectRouter = Router();

// Create Project
projectRouter.post('/', (req: Request, res: Response) => {
  try {
    const { title, topic, contentType, aspectRatio, targetDurationSec, language, visualStyle, tone, voiceId, researchDepth, autonomyLevel, maxBudgetUsd } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic or content request is required' });
    }

    const projectTitle = title && title.trim() ? title : topic.slice(0, 50);

    const project = projectRepository.create({
      title: projectTitle,
      topic,
      contentType,
      aspectRatio,
      targetDurationSec: targetDurationSec ? parseInt(targetDurationSec, 10) : undefined,
      language,
      visualStyle,
      tone,
      voiceId,
      researchDepth,
      autonomyLevel,
      maxBudgetUsd: maxBudgetUsd ? parseFloat(maxBudgetUsd) : undefined
    });

    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List Projects
projectRouter.get('/', (_req: Request, res: Response) => {
  try {
    const projects = projectRepository.list();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Project Details & Complete State
projectRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = projectRepository.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const scenes = sceneRepository.findByProject(id);
    const assets = assetRepository.findByProject(id);
    const tasks = taskRepository.findByProject(id);
    const blueprint = blueprintRepository.getBlueprint(id);
    const research = blueprintRepository.getResearch(id);
    const qualityReport = qaRepository.getReport(id);
    const cost = costRepository.getProjectCost(id);

    res.json({
      project,
      scenes,
      assets,
      tasks,
      blueprint,
      research,
      qualityReport,
      cost,
      timeline: continuityRepository.getTimeline(id),
      continuity: continuityRepository.getProfiles(id),
      isActive: orchestratorAgent.isProjectActive(id)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Machine-Readable Video Production Timeline
projectRouter.get('/:id/timeline', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const timeline = continuityRepository.getTimeline(id);
    if (!timeline) return res.status(404).json({ error: 'Timeline not yet generated for this project' });
    res.json(timeline);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Project Continuity Profiles (Characters, Locations, Objects, Styles)
projectRouter.get('/:id/continuity', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const profiles = continuityRepository.getProfiles(id);
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Scene Prompt & Visual Directives [EDIT PROMPT]
projectRouter.put('/:id/scenes/:sceneId/prompt', (req: Request, res: Response) => {
  try {
    const sceneId = req.params.sceneId as string;
    const { visualPrompt, narrationText, transition, animationType } = req.body;
    sceneRepository.update(sceneId, { visualPrompt, narrationText, transition, animationType });
    const updated = sceneRepository.findById(sceneId);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Regenerate Single Scene Asset [REGENERATE]
projectRouter.post('/:id/scenes/:sceneId/regenerate', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sceneId = req.params.sceneId as string;
    const project = projectRepository.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const scene = sceneRepository.findById(sceneId);
    if (!scene) return res.status(404).json({ error: 'Scene not found' });

    // Regenerate visual asset for this specific scene
    const imageProvider = ProviderFactory.getImageProvider();
    const prompt = scene.visualPrompt || `${project.visualStyle} scene`;
    const { buffer, mimeType, width, height, costUsd } = await imageProvider.generateImage(prompt, {
      aspectRatio: project.aspectRatio,
      style: project.visualStyle
    });

    const fileName = `scene_${String(scene.sceneNumber).padStart(2, '0')}_regen_${Date.now()}.png`;
    const fullPath = storageService.writeProjectFile(id, `assets/images/${fileName}`, buffer);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    const asset = assetRepository.create({
      projectId: id,
      sceneId: scene.id,
      assetType: 'IMAGE',
      provider: imageProvider.name,
      model: 'image-gen-regen',
      prompt,
      filePath: fullPath,
      fileName,
      mimeType,
      fileSizeBytes: buffer.length,
      resolution: `${width}x${height}`,
      costUsd,
      checksum
    });

    sceneRepository.update(scene.id, { imageAssetId: asset.id });
    res.json({ message: 'Scene visual regenerated successfully', scene: sceneRepository.findById(scene.id), asset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start or Resume Production Pipeline (Non-blocking background job)
projectRouter.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = projectRepository.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (orchestratorAgent.isProjectActive(id)) {
      return res.json({ message: 'Project pipeline is already running', status: project.status });
    }

    // Trigger in background without blocking HTTP response
    setImmediate(async () => {
      try {
        await orchestratorAgent.startOrResumePipeline(id);
      } catch (err: any) {
        console.error(`Pipeline execution error for project ${id}:`, err);
      }
    });

    res.json({ message: 'Production pipeline started in background', status: 'RUNNING' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pause Production Pipeline
projectRouter.post('/:id/pause', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    orchestratorAgent.pausePipeline(id);
    res.json({ message: 'Pipeline paused', status: 'PAUSED' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server-Sent Events (SSE) stream for live updates
projectRouter.get('/:id/stream', (req: Request, res: Response) => {
  const id = req.params.id as string;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', projectId: id })}\n\n`);

  const unsubscribe = eventBus.subscribeToProject(id, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Download Asset or Package
projectRouter.get('/:id/download/:type', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const type = req.params.type as string;
    const project = projectRepository.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const projectDir = storageService.getProjectDir(id);

    let filePath = '';
    let downloadName = '';

    switch (type) {
      case 'video':
        filePath = path.join(projectDir, 'renders', 'final_video.mp4');
        downloadName = `${storageService.sanitizeFileName(project.title)}.mp4`;
        break;
      case 'thumbnail':
        filePath = path.join(projectDir, 'content', 'thumbnail.png');
        downloadName = `${storageService.sanitizeFileName(project.title)}_thumbnail.png`;
        break;
      case 'srt':
        filePath = path.join(projectDir, 'content', 'subtitles.srt');
        downloadName = `${storageService.sanitizeFileName(project.title)}.srt`;
        break;
      case 'vtt':
        filePath = path.join(projectDir, 'content', 'subtitles.vtt');
        downloadName = `${storageService.sanitizeFileName(project.title)}.vtt`;
        break;
      case 'script':
        filePath = path.join(projectDir, 'content', 'script.md');
        downloadName = `${storageService.sanitizeFileName(project.title)}_script.md`;
        break;
      case 'research':
        filePath = path.join(projectDir, 'research', 'research_notes.md');
        downloadName = `${storageService.sanitizeFileName(project.title)}_research.md`;
        break;
      case 'sources':
        filePath = path.join(projectDir, 'research', 'research_sources.json');
        downloadName = `${storageService.sanitizeFileName(project.title)}_sources.json`;
        break;
      case 'timeline':
        filePath = path.join(projectDir, 'content', 'timeline.json');
        downloadName = `${storageService.sanitizeFileName(project.title)}_timeline.json`;
        break;
      case 'package':
      case 'zip':
        filePath = path.join(projectDir, `${storageService.sanitizeFileName(project.title)}_package.zip`);
        downloadName = `${storageService.sanitizeFileName(project.title)}_package.zip`;
        break;
      default:
        return res.status(400).json({ error: `Unknown download artifact type: ${type}` });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found on server: ${type}` });
    }

    res.download(filePath, downloadName);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Project and Cleanup Storage
projectRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    projectRepository.delete(id);
    storageService.deleteProjectStorage(id);
    res.json({ message: 'Project and storage successfully deleted', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
