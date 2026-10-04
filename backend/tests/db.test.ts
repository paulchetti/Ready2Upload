import { describe, it, expect, beforeAll } from 'vitest';
import { appDatabase } from '../src/db/database';
import { projectRepository } from '../src/db/project.repository';
import { sceneRepository } from '../src/db/scene.repository';
import { taskRepository } from '../src/db/task.repository';
import { blueprintRepository, qaRepository, costRepository } from '../src/db/blueprint.repository';
import fs from 'fs';
import path from 'path';

describe('Database & Repositories (Phase 2)', () => {
  const testDbPath = path.resolve(__dirname, 'test.db');

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Initialize test database
    const db = new (appDatabase.constructor as any)(testDbPath);
    await db.initialize();
    // Replace default instance database reference for tests
    (appDatabase as any).db = db.getRawDb();
    (appDatabase as any).dbPath = testDbPath;
  });

  it('should create and retrieve a project', () => {
    const project = projectRepository.create({
      title: 'Tower of Babel Evidence',
      topic: 'Archaeological evidence for the Tower of Babel',
      contentType: 'youtube_long',
      language: 'English',
      autonomyLevel: 'LEVEL_2_PRODUCTION',
      maxBudgetUsd: 10.0
    });

    expect(project.id).toBeDefined();
    expect(project.title).toBe('Tower of Babel Evidence');
    expect(project.status).toBe('DRAFT');
    expect(project.aspectRatio).toBe('16:9');

    const fetched = projectRepository.findById(project.id);
    expect(fetched).toBeDefined();
    expect(fetched?.topic).toBe('Archaeological evidence for the Tower of Babel');
  });

  it('should update project status', () => {
    const project = projectRepository.create({
      title: 'Shorts on Black Holes',
      topic: 'Black holes physics',
      contentType: 'youtube_short'
    });

    projectRepository.updateStatus(project.id, 'RESEARCHING', 'Gathering physics papers');

    const updated = projectRepository.findById(project.id);
    expect(updated?.status).toBe('RESEARCHING');
    expect(updated?.currentStep).toBe('Gathering physics papers');
  });

  it('should create and fetch storyboard scenes in order', () => {
    const project = projectRepository.create({
      title: 'Scene Test Project',
      topic: 'Test topic'
    });

    const scenes = sceneRepository.createBatch(project.id, [
      {
        sceneNumber: 1,
        startTimeSec: 0,
        durationSec: 8,
        narrationText: 'What if ancient records hold the truth?',
        visualPrompt: 'Ancient Mesopotamian ziggurat at sunset',
        mediaType: 'IMAGE_ONLY',
        transition: 'fade'
      },
      {
        sceneNumber: 2,
        startTimeSec: 8,
        durationSec: 10,
        narrationText: 'Archaeologists uncovered bricks bearing royal stamps.',
        visualPrompt: 'Excavation site with cuneiform stamped bricks',
        mediaType: 'VIDEO_CLIP',
        transition: 'crossfade'
      }
    ]);

    expect(scenes.length).toBe(2);
    expect(scenes[0].sceneNumber).toBe(1);

    const fetchedScenes = sceneRepository.findByProject(project.id);
    expect(fetchedScenes.length).toBe(2);
    expect(fetchedScenes[0].narrationText).toContain('ancient records');
    expect(fetchedScenes[1].mediaType).toBe('VIDEO_CLIP');
  });

  it('should track workflow tasks and update progress', () => {
    const project = projectRepository.create({
      title: 'Task Tracking Project',
      topic: 'Task tracking'
    });

    const task = taskRepository.create({
      projectId: project.id,
      agentName: 'ResearchAgent',
      taskType: 'GATHER_SOURCES',
      message: 'Searching academic sources'
    });

    expect(task.status).toBe('PENDING');

    taskRepository.update(task.id, {
      status: 'RUNNING',
      progress: 50,
      message: 'Analyzing 12 sources'
    });

    const tasks = taskRepository.findByProject(project.id);
    expect(tasks.length).toBe(1);
    expect(tasks[0].progress).toBe(50);
    expect(tasks[0].status).toBe('RUNNING');
  });

  it('should record and aggregate project costs', () => {
    const project = projectRepository.create({
      title: 'Cost Tracking Project',
      topic: 'Cost testing'
    });

    costRepository.recordCost({
      projectId: project.id,
      provider: 'mock',
      model: 'mock-llm',
      operation: 'RESEARCH_SYNTHESIS',
      tokensUsed: 1200,
      costUsd: 0.05
    });

    costRepository.recordCost({
      projectId: project.id,
      provider: 'mock',
      model: 'mock-image',
      operation: 'IMAGE_GENERATION',
      costUsd: 0.08
    });

    const costSummary = costRepository.getProjectCost(project.id);
    expect(costSummary.records.length).toBe(2);
    expect(costSummary.totalUsd).toBeCloseTo(0.13, 2);
  });
});
