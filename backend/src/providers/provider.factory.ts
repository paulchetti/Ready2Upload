import { config } from '../config';
import {
  ILLMProvider,
  IImageProvider,
  IVoiceProvider,
  IVideoProvider
} from './provider.interface';
import {
  MockLLMProvider,
  MockImageProvider,
  MockVoiceProvider,
  MockVideoProvider
} from './mock/mock.provider';
import { GeminiLLMProvider } from './gemini/gemini.provider';
import { GeminiVoiceProvider } from './gemini/gemini.voice';
import { AIImageProvider } from './image/ai-image.provider';

export class ProviderFactory {
  public static getLLMProvider(override?: string): ILLMProvider {
    const selected = override || config.providers.llm;

    if (selected === 'gemini' && config.apiKeys.gemini) {
      return new GeminiLLMProvider(config.apiKeys.gemini);
    }

    // Default fallback to MockLLMProvider for zero-cost operation
    return new MockLLMProvider();
  }

  public static getImageProvider(override?: string): IImageProvider {
    const selected = override || config.providers.image;
    if (selected === 'mock') {
      return new MockImageProvider();
    }
    // Default to AI Image generation (Flux / SDXL photorealistic images)
    return new AIImageProvider();
  }

  public static getVoiceProvider(override?: string): IVoiceProvider {
    const selected = override || config.providers.voice;
    if (config.apiKeys.gemini && selected !== 'mock') {
      return new GeminiVoiceProvider(config.apiKeys.gemini);
    }
    return new MockVoiceProvider();
  }

  public static getVideoProvider(override?: string): IVideoProvider {
    const _selected = override || config.providers.video;
    // Default fallback to MockVideoProvider
    return new MockVideoProvider();
  }
}
