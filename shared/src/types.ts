/**
 * Standalone AI Content Production Platform — Shared Type Definitions
 */

export type ContentType =
  | 'youtube_long'
  | 'youtube_short'
  | 'instagram_reel'
  | 'x_video'
  | 'educational_doc'
  | 'social_explainer';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type AutonomyLevel =
  | 'LEVEL_1_ASSISTED'
  | 'LEVEL_2_PRODUCTION'
  | 'LEVEL_3_AUTONOMOUS';

export type ProjectStatus =
  | 'DRAFT'
  | 'RESEARCHING'
  | 'PLANNING'
  | 'SCRIPTING'
  | 'STORYBOARDING'
  | 'GENERATING_MEDIA'
  | 'EDITING'
  | 'QA_CHECK'
  | 'REVIEW'
  | 'READY'
  | 'COMPLETED'
  | 'PAUSED'
  | 'FAILED';

export interface Project {
  id: string;
  title: string;
  topic: string;
  contentType: ContentType;
  aspectRatio: AspectRatio;
  targetDurationSec: number;
  language: string;
  visualStyle: string;
  tone: string;
  voiceId: string;
  researchDepth: 'minimal' | 'standard' | 'deep';
  status: ProjectStatus;
  autonomyLevel: AutonomyLevel;
  maxBudgetUsd: number;
  currentStep: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchClaim {
  claim: string;
  source: string;
  isFact: boolean;
  confidence: number;
}

export interface ResearchSource {
  id: string;
  title: string;
  url?: string;
  author?: string;
  year?: number;
  reliability: 'high' | 'medium' | 'peer_reviewed' | 'historical_record';
}

export interface ResearchDossier {
  projectId: string;
  topic: string;
  summary: string;
  keyClaims: ResearchClaim[];
  sources: ResearchSource[];
  notesMarkdown: string;
}

export interface ThumbnailConcept {
  concept: string;
  visualPrompt: string;
  textOverlay: string;
}

export interface ContentBlueprint {
  projectId: string;
  title: string;
  hook: string;
  targetAudience: string;
  tone: string;
  language: string;
  estimatedDurationSec: number;
  scriptBody: string;
  spokenWordCount: number;
  thumbnailConcepts: ThumbnailConcept[];
}

export type QualityProfile = 'DRAFT' | 'STANDARD' | 'HIGH' | 'MAX';

export type SceneMediaType =
  | 'AI_VIDEO'
  | 'AI_IMAGE'
  | 'STOCK_ASSET'
  | 'MOTION_GRAPHIC'
  | 'TEXT_GRAPHIC'
  | 'MAP'
  | 'DIAGRAM'
  | 'SCREENSHOT'
  | 'ARCHIVAL_ASSET'
  | 'MIXED'
  | 'IMAGE_ONLY'
  | 'VIDEO_CLIP';

export type SceneTransition = 'fade' | 'crossfade' | 'wipe' | 'cut' | 'dissolve' | 'zoom';

export type SceneAnimationType =
  | 'slow_zoom_in'
  | 'slow_zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'vertical_movement'
  | 'parallax'
  | 'static'
  | 'motion_clip';

export interface VisualDirective {
  scenePurpose: string;
  narrationSection: string;
  visualConcept: string;
  cameraPerspective: string;
  environment: string;
  subjects: string;
  action: string;
  lighting: string;
  mood: string;
  colorStyle: string;
  mediaRequirement: SceneMediaType;
  animationRequirement: SceneAnimationType;
  transition: SceneTransition;
  textOverlay?: string;
  soundEffects?: string[];
  musicIntensity: 'subtle' | 'building' | 'epic' | 'tension' | 'reflective' | 'triumphant';
  characterId?: string;
  locationId?: string;
  objectId?: string;
  styleId?: string;
}

export interface StructuredPrompt {
  subject: string;
  environment: string;
  timePeriod?: string;
  action: string;
  composition: string;
  camera: string;
  lighting: string;
  mood: string;
  style: string;
  color?: string;
  detail?: string;
  aspectRatio: AspectRatio;
  continuity?: string;
  fullPrompt: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  age?: number;
  clothing: string;
  physicalAppearance: string;
  visualStyle: string;
}

export interface LocationProfile {
  id: string;
  name: string;
  environment: string;
  architecturalStyle: string;
  timePeriod: string;
  lighting: string;
}

export interface ObjectProfile {
  id: string;
  name: string;
  appearance: string;
  material: string;
  details: string;
}

export interface StyleProfile {
  id: string;
  palette: string;
  grain: string;
  lensCharacteristics: string;
  overallAesthetic: string;
}

export interface ContinuityManifest {
  characters: CharacterProfile[];
  locations: LocationProfile[];
  objects: ObjectProfile[];
  styles: StyleProfile[];
}

export interface Scene {
  id: string;
  projectId: string;
  sceneNumber: number;
  startTimeSec: number;
  durationSec: number;
  narrationText: string;
  visualPrompt: string;
  mediaType: SceneMediaType;
  textOverlay?: string;
  transition: SceneTransition;
  visualDirective?: VisualDirective;
  structuredPrompt?: StructuredPrompt;
  animationType?: SceneAnimationType;
  soundEffects?: string[];
  musicIntensity?: string;
  characterId?: string;
  locationId?: string;
  objectId?: string;
  styleId?: string;
  imageAssetId?: string;
  videoAssetId?: string;
  audioStemId?: string;
  assetUrl?: string;
  audioUrl?: string;
}

export interface TimelineVideoClip {
  id: string;
  sceneId: string;
  sceneNumber: number;
  mediaType: SceneMediaType;
  startSec: number;
  endSec: number;
  durationSec: number;
  assetPath: string;
  transition: SceneTransition;
  animationType: SceneAnimationType;
  textOverlay?: string;
}

export interface TimelineNarrationCue {
  id: string;
  sceneId: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  text: string;
  audioPath: string;
}

export interface TimelineMusicCue {
  id: string;
  title: string;
  style: string;
  mood: string;
  intensity: string;
  startSec: number;
  endSec: number;
  volume: number;
  duckingLevel: number;
  audioPath?: string;
}

export interface TimelineSFXCue {
  id: string;
  sceneId: string;
  effectName: string;
  timestampSec: number;
  durationSec: number;
  volume: number;
  audioPath?: string;
}

export interface TimelineSubtitleCue {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
}

export interface TimelineData {
  projectId: string;
  totalDurationSec: number;
  aspectRatio: AspectRatio;
  resolution: string;
  fps: number;
  tracks: {
    video: TimelineVideoClip[];
    narration: TimelineNarrationCue[];
    music: TimelineMusicCue[];
    sfx: TimelineSFXCue[];
    subtitles: TimelineSubtitleCue[];
  };
  generatedAt: string;
}

export type AssetType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'THUMBNAIL' | 'SUBTITLE' | 'GRAPHIC' | 'MUSIC' | 'SFX';

export interface Asset {
  id: string;
  projectId: string;
  sceneId?: string;
  assetType: AssetType;
  provider: string;
  model: string;
  prompt?: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  resolution?: string;
  durationSec?: number;
  costUsd: number;
  checksum: string;
  createdAt: string;
}

export type QACheckStatus = 'PASS' | 'WARN' | 'FAIL';

export interface QACheckResult {
  checkId: string;
  name: string;
  status: QACheckStatus;
  description: string;
  remediation?: string;
}

export interface QualityReport {
  id: string;
  projectId: string;
  overallStatus: QACheckStatus;
  score: number; // 0-100
  checks: QACheckResult[];
  evaluatedAt: string;
}

export type AgentName =
  | 'Orchestrator'
  | 'ResearchAgent'
  | 'CreativeAgent'
  | 'StoryboardAgent'
  | 'VisualDirectorAgent'
  | 'ImageAgent'
  | 'VideoAgent'
  | 'VoiceAgent'
  | 'AudioDesignAgent'
  | 'VideoEditingAgent'
  | 'SubtitleAgent'
  | 'ThumbnailAgent'
  | 'QAAgent'
  | 'ExportAgent';

export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface WorkflowTask {
  id: string;
  projectId: string;
  agentName: AgentName;
  taskType: string;
  status: TaskStatus;
  progress: number; // 0-100
  message: string;
  errorLog?: string;
  retryCount: number;
  startedAt?: string;
  completedAt?: string;
}

export interface ProjectExport {
  projectId: string;
  finalVideoPath?: string;
  thumbnailPath?: string;
  subtitlesSrtPath?: string;
  subtitlesVttPath?: string;
  scriptPath?: string;
  researchPath?: string;
  sourcesPath?: string;
  zipPath?: string;
  totalPackageSizeBytes: number;
}

export interface CostRecord {
  id: string;
  projectId: string;
  provider: string;
  model: string;
  operation: string;
  tokensUsed?: number;
  computeSeconds?: number;
  costUsd: number;
  timestamp: string;
}

export interface CreatorProfile {
  id: string;
  creatorName: string;
  brandIdentity: string;
  preferredLanguage: string;
  preferredTone: string;
  preferredVisualStyle: string;
  defaultVoiceId: string;
  defaultAspectRatio: AspectRatio;
  defaultAutonomyLevel: AutonomyLevel;
}

export interface WorkflowEvent {
  type: 'TASK_STARTED' | 'TASK_PROGRESS' | 'TASK_COMPLETED' | 'TASK_FAILED' | 'PROJECT_STATUS_CHANGED' | 'LOG_MESSAGE';
  projectId: string;
  taskId?: string;
  agentName?: AgentName;
  status?: string;
  progress?: number;
  message?: string;
  data?: any;
  timestamp: string;
}
