import { describe, it, expect, beforeAll } from 'vitest';
import { appDatabase } from '../src/db/database';
import { projectRepository } from '../src/db/project.repository';
import { sceneRepository } from '../src/db/scene.repository';
import { assetRepository } from '../src/db/asset.repository';
import { blueprintRepository, qaRepository } from '../src/db/blueprint.repository';
import { orchestratorAgent } from '../src/agents/orchestrator/orchestrator.agent';
import { storageService } from '../src/storage/storage.service';
import fs from 'fs';
import path from 'path';

describe('Autonomous Orchestration Pipeline (End-to-End)', () => {
  const testDbPath = path.resolve(__dirname, 'test_orchestration.db');

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const db = new (appDatabase.constructor as any)(testDbPath);
    await db.initialize();
    (appDatabase as any).db = db.getRawDb();
    (appDatabase as any).dbPath = testDbPath;
  });

  it('should autonomously run end-to-end pipeline from prompt to download package', async () => {
    // 1. Create project
    const project = projectRepository.create({
      title: 'Tower of Babel Archaeological Evidence',
      topic: 'Archaeological discoveries and royal inscriptions regarding the Tower of Babel',
      contentType: 'youtube_long',
      aspectRatio: '16:9',
      targetDurationSec: 30, // Short duration for fast test rendering
      language: 'English',
      autonomyLevel: 'LEVEL_2_PRODUCTION'
    });

    expect(project.id).toBeDefined();
    expect(project.status).toBe('DRAFT');

    // 2. Start Orchestrator pipeline
    await orchestratorAgent.startOrResumePipeline(project.id);

    // 3. Verify Research
    const research = blueprintRepository.getResearch(project.id);
    expect(research).toBeDefined();
    expect(research?.keyClaims.length).toBeGreaterThan(0);
    expect(research?.sources.length).toBeGreaterThan(0);

    // 4. Verify Creative Blueprint & Script
    const blueprint = blueprintRepository.getBlueprint(project.id);
    expect(blueprint).toBeDefined();
    expect(blueprint?.hook).toBeDefined();
    expect(blueprint?.scriptBody.length).toBeGreaterThan(50);

    // 5. Verify Storyboard Scenes
    const scenes = sceneRepository.findByProject(project.id);
    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes[0].visualPrompt).toBeDefined();

    // 6. Verify Assets (Images, Audio stems, Thumbnail, Final Video)
    const assets = assetRepository.findByProject(project.id);
    const images = assets.filter((a) => a.assetType === 'IMAGE');
    const audio = assets.filter((a) => a.assetType === 'AUDIO');
    const thumbnail = assets.find((a) => a.assetType === 'THUMBNAIL');
    const video = assets.find((a) => a.assetType === 'VIDEO');

    expect(images.length).toBe(scenes.length);
    expect(audio.length).toBe(scenes.length);
    expect(thumbnail).toBeDefined();
    expect(video).toBeDefined();

    // 7. Verify Files on Disk
    const projectDir = storageService.getProjectDir(project.id);
    expect(fs.existsSync(path.join(projectDir, 'renders', 'final_video.mp4'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'content', 'thumbnail.png'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'content', 'subtitles.srt'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'content', 'subtitles.vtt'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'content', 'script.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'research', 'research_notes.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'metadata.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'README.md'))).toBe(true);

    // Verify ZIP archive was created
    const zipFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('_package.zip'));
    expect(zipFiles.length).toBe(1);
    const zipPath = path.join(projectDir, zipFiles[0]);
    expect(fs.statSync(zipPath).size).toBeGreaterThan(1000);

    // 8. Verify QA Report
    const qaReport = qaRepository.getReport(project.id);
    expect(qaReport).toBeDefined();
    expect(qaReport?.checks.length).toBe(15);
    expect(qaReport?.overallStatus).toBe('PASS');

    // 9. Verify Project Final Status
    const finalProject = projectRepository.findById(project.id);
    expect(finalProject?.status).toBe('READY');
  }, 90000); // 90s timeout for FFmpeg rendering of all scene parts
});
