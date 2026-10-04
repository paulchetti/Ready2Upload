export interface LLMGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ILLMProvider {
  name: string;
  generateText(prompt: string, options?: LLMGenerationOptions): Promise<{ text: string; tokensUsed: number; costUsd: number }>;
  generateJSON<T>(prompt: string, schemaDescription: string, options?: LLMGenerationOptions): Promise<{ data: T; tokensUsed: number; costUsd: number }>;
}

export interface ImageGenerationOptions {
  aspectRatio: '16:9' | '9:16' | '1:1';
  style?: string;
  seed?: number;
}

export interface IImageProvider {
  name: string;
  generateImage(prompt: string, options: ImageGenerationOptions): Promise<{
    buffer: Buffer;
    mimeType: string;
    width: number;
    height: number;
    costUsd: number;
  }>;
}

export interface VoiceGenerationOptions {
  voiceId?: string;
  speed?: number;
  tone?: string;
  language?: string;
}

export interface WordTimestamp {
  word: string;
  startTimeSec: number;
  endTimeSec: number;
}

export interface IVoiceProvider {
  name: string;
  generateSpeech(text: string, options?: VoiceGenerationOptions): Promise<{
    audioBuffer: Buffer;
    durationSec: number;
    mimeType: string;
    timestamps?: WordTimestamp[];
    costUsd: number;
  }>;
}

export interface VideoGenerationOptions {
  aspectRatio: '16:9' | '9:16' | '1:1';
  durationSec?: number;
  imageInputBuffer?: Buffer;
}

export interface IVideoProvider {
  name: string;
  generateClip(prompt: string, options: VideoGenerationOptions): Promise<{
    videoBuffer: Buffer;
    durationSec: number;
    mimeType: string;
    costUsd: number;
  }>;
}
