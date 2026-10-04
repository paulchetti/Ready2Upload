import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to local .env if present

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '127.0.0.1',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR || './storage'),
  databaseUrl: process.env.DATABASE_URL || 'file:./production.db',

  defaultAutonomyLevel: (process.env.DEFAULT_AUTONOMY_LEVEL || 'LEVEL_2_PRODUCTION') as
    | 'LEVEL_1_ASSISTED'
    | 'LEVEL_2_PRODUCTION'
    | 'LEVEL_3_AUTONOMOUS',

  maxProjectBudgetUsd: parseFloat(process.env.MAX_PROJECT_BUDGET_USD || '5.00'),
  dailyBudgetUsd: parseFloat(process.env.DAILY_BUDGET_USD || '25.00'),

  providers: {
    llm: process.env.DEFAULT_LLM_PROVIDER || 'mock',
    image: process.env.DEFAULT_IMAGE_PROVIDER || 'mock',
    voice: process.env.DEFAULT_VOICE_PROVIDER || 'mock',
    video: process.env.DEFAULT_VIDEO_PROVIDER || 'mock'
  },

  apiKeys: {
    gemini: process.env.GEMINI_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    elevenlabs: process.env.ELEVENLABS_API_KEY || '',
    elevenlabsDefaultVoiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
    stability: process.env.STABILITY_API_KEY || '',
    videoGen: process.env.VIDEO_GEN_API_KEY || ''
  },

  media: {
    defaultFps: parseInt(process.env.DEFAULT_FPS || '30', 10),
    defaultVideoBitrate: process.env.DEFAULT_VIDEO_BITRATE || '4500k',
    defaultAudioBitrate: process.env.DEFAULT_AUDIO_BITRATE || '192k',
    defaultAudioLufs: parseFloat(process.env.DEFAULT_AUDIO_LUFS || '-14'),
    ffmpegPath: process.env.FFMPEG_PATH || '',
    ffprobePath: process.env.FFPROBE_PATH || ''
  }
};
