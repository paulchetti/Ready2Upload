import { describe, it, expect, beforeAll } from 'vitest';
import { appDatabase } from '../src/db/database';
import { projectRepository } from '../src/db/project.repository';
import { sceneRepository } from '../src/db/scene.repository';
import { continuityRepository } from '../src/db/continuity.repository';
import { visualDirectorAgent } from '../src/agents/visual-director/visual-director.agent';
import { mediaDecisionService } from '../src/pipeline/media-decision.service';
import { promptGeneratorService } from '../src/pipeline/prompt-generator.service';
import { audioDesignService } from '../src/pipeline/audio-design.service';
import { timelineService } from '../src/pipeline/timeline.service';
import { graphicsService } from '../src/pipeline/graphics.service';
import { costEstimatorService } from '../src/pipeline/cost-estimator.service';
import fs from 'fs';
import path from 'path';

describe('Full-Length AI Video Production Engine Add-On', () => {
  const testDbPath = path.resolve(__dirname, 'test_full_length.db');

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const db = new (appDatabase.constructor as any)(testDbPath);
    await db.initialize();
    (appDatabase as any).db = db.getRawDb();
    (appDatabase as any).dbPath = testDbPath;
  });

  it('should calculate accurate cost estimates for a 10-minute documentary', () => {
    const project = projectRepository.create({
      title: 'Silk Road Documentary',
      topic: '10-minute documentary about the history of the Silk Road',
      contentType: 'educational_doc',
      aspectRatio: '16:9',
      targetDurationSec: 600, // 10 minutes
      maxBudgetUsd: 15.0
    });

    const estimate = costEstimatorService.estimateProductionCost(project);
    expect(estimate.estimatedScenes).toBeGreaterThan(60);
    expect(estimate.totalEstimatedCostUsd).toBeLessThan(15.0);
    expect(estimate.isWithinBudget).toBe(true);
  });

  it('should intelligently assign media types using MediaDecisionService', () => {
    const mapDecision = mediaDecisionService.decide({
      scenePurpose: 'Geographical route explanation',
      narrationText: 'The northern route branched through the oasis of Dunhuang and the Pamir Mountains.',
      actionDescription: 'Animated map showing ancient trade route',
      hasStatisticsOrData: false,
      hasGeographicalContext: true,
      isActionHeavy: false,
      durationSec: 8
    });
    expect(mapDecision.mediaType).toBe('MAP');

    const battleDecision = mediaDecisionService.decide({
      scenePurpose: 'Battle of Talas',
      narrationText: 'In 751 CE, Tang imperial forces clashed with the Abbasid army in a ferocious battle.',
      actionDescription: 'Intense cinematic cavalry charging across open steppe',
      hasStatisticsOrData: false,
      hasGeographicalContext: false,
      isActionHeavy: true,
      durationSec: 6
    });
    expect(battleDecision.mediaType).toBe('AI_VIDEO');

    const portraitDecision = mediaDecisionService.decide({
      scenePurpose: 'Emperor Wu portrait',
      narrationText: 'Emperor Wu of Han dispatched diplomat Zhang Qian on a mission to the West.',
      actionDescription: 'Historical portrait of Emperor Wu in ceremonial robes',
      hasStatisticsOrData: false,
      hasGeographicalContext: false,
      isActionHeavy: false,
      durationSec: 7
    });
    expect(portraitDecision.mediaType).toBe('AI_IMAGE');
  });

  it('should build continuity profiles and structured prompts via VisualDirectorAgent', async () => {
    const project = projectRepository.create({
      title: 'Silk Road Chronicles',
      topic: 'History of the Silk Road trade routes',
      contentType: 'youtube_long',
      aspectRatio: '16:9',
      targetDurationSec: 30,
      visualStyle: 'Cinematic historical reconstruction'
    });

    const mockBlueprint = {
      projectId: project.id,
      title: project.title,
      hook: 'Two thousand years ago, an interconnected web of routes linked East and West.',
      targetAudience: 'History enthusiasts',
      tone: 'Majestic & Scholarly',
      language: 'English',
      estimatedDurationSec: 30,
      scriptBody: 'Merchants led camel caravans across the Taklamakan Desert. Royal silk was exchanged for Roman glassware and Arabian frankincense. Ideas and inventions transformed civilizations.',
      spokenWordCount: 32,
      thumbnailConcepts: []
    };

    const initialScenes = [
      {
        sceneNumber: 1,
        startTimeSec: 0,
        durationSec: 10,
        narrationText: 'Merchants led camel caravans across the Taklamakan Desert.',
        visualPrompt: 'Caravan of merchants and camels traversing dunes at sunset',
        mediaType: 'AI_IMAGE' as const,
        transition: 'crossfade' as const
      },
      {
        sceneNumber: 2,
        startTimeSec: 10,
        durationSec: 10,
        narrationText: 'Royal silk was exchanged for Roman glassware and Arabian frankincense.',
        visualPrompt: 'Close up of hands trading silk and glass vessels in bustling bazaar',
        mediaType: 'AI_IMAGE' as const,
        transition: 'crossfade' as const
      }
    ];

    const savedScenes = sceneRepository.createBatch(project.id, initialScenes);
    const result = await visualDirectorAgent.run(project, mockBlueprint, savedScenes);

    expect(result.manifest.styles.length).toBeGreaterThan(0);
    expect(result.scenes.length).toBe(2);

    const scene1 = result.scenes[0];
    expect(scene1.visualDirective).toBeDefined();
    expect(scene1.structuredPrompt).toBeDefined();
    expect(scene1.structuredPrompt?.subject).toBeDefined();
    expect(scene1.structuredPrompt?.camera).toBeDefined();
    expect(scene1.structuredPrompt?.lighting).toBeDefined();
    expect(scene1.structuredPrompt?.continuity).toBeDefined();

    // Verify stored in DB
    const storedProfiles = continuityRepository.getProfiles(project.id);
    expect(storedProfiles).toBeDefined();
  });

  it('should generate audio plan and compile master multi-track timeline.json', () => {
    const project = projectRepository.create({
      title: 'Full Length Timeline Test',
      topic: 'Testing multi-track synchronization',
      contentType: 'educational_doc',
      aspectRatio: '16:9',
      targetDurationSec: 40
    });

    const scenes = [
      {
        id: 'sc-1',
        projectId: project.id,
        sceneNumber: 1,
        startTimeSec: 0,
        durationSec: 8,
        narrationText: 'First scene spoken narrative',
        visualPrompt: 'Visual 1',
        mediaType: 'AI_IMAGE' as const,
        transition: 'crossfade' as const,
        soundEffects: ['desert_wind_subtle']
      },
      {
        id: 'sc-2',
        projectId: project.id,
        sceneNumber: 2,
        startTimeSec: 8,
        durationSec: 12,
        narrationText: 'Second scene historical narrative',
        visualPrompt: 'Visual 2',
        mediaType: 'AI_VIDEO' as const,
        transition: 'cut' as const
      }
    ];

    const audioPlan = audioDesignService.createAudioPlan(project.id, scenes, 20);
    expect(audioPlan.musicCues.length).toBeGreaterThan(0);
    expect(audioPlan.musicCues[0].duckingLevel).toBeDefined();
    expect(audioPlan.sfxCues.length).toBe(1);

    const timeline = timelineService.buildTimeline(project, scenes, [], audioPlan);
    expect(timeline.tracks.video.length).toBe(2);
    expect(timeline.tracks.music.length).toBeGreaterThan(0);
    expect(timeline.tracks.sfx.length).toBe(1);
    expect(timeline.tracks.subtitles.length).toBe(2);
    expect(timeline.totalDurationSec).toBe(20);

    const fetchedTimeline = continuityRepository.getTimeline(project.id);
    expect(fetchedTimeline).toBeDefined();
    expect(fetchedTimeline?.projectId).toBe(project.id);
  });

  it('should render programmatic map and statistics SVGs cleanly without errors', () => {
    const mapSvg = graphicsService.generateMapSVG('Silk Road Trade Network', 'Central Asian Steppe');
    expect(mapSvg).toContain('HISTORICAL CARTOGRAPHY');
    expect(mapSvg).toContain("CHANG'AN");
    expect(mapSvg).toContain('SAMARKAND');

    const statSvg = graphicsService.generateStatisticsSVG('6,400 KM', 'TOTAL CARAVAN DISTANCE', 'Linking Chang\'an to Rome');
    expect(statSvg).toContain('6,400 KM');
    expect(statSvg).toContain('TOTAL CARAVAN DISTANCE');
  });
});
