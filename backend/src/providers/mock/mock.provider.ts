import {
  ILLMProvider,
  IImageProvider,
  IVoiceProvider,
  IVideoProvider,
  LLMGenerationOptions,
  ImageGenerationOptions,
  VoiceGenerationOptions,
  VideoGenerationOptions,
  WordTimestamp
} from '../provider.interface';
import { createMockWavAudio, createMockPngImage } from './mock.media';

export class MockLLMProvider implements ILLMProvider {
  public name = 'mock-llm';

  public async generateText(
    prompt: string,
    _options?: LLMGenerationOptions
  ): Promise<{ text: string; tokensUsed: number; costUsd: number }> {
    const text = `Autonomous content analysis and synthesis for prompt: "${prompt.slice(0, 100)}...". The investigation demonstrates robust evidence, historical parallels, and compelling narrative arcs suitable for digital audiences.`;
    return { text, tokensUsed: 350, costUsd: 0.001 };
  }

  public async generateJSON<T>(
    prompt: string,
    schemaDescription: string,
    _options?: LLMGenerationOptions
  ): Promise<{ data: T; tokensUsed: number; costUsd: number }> {
    // If prompt is for research dossier
    if (schemaDescription.includes('ResearchDossier')) {
      const mockResearch = {
        topic: prompt.slice(0, 80),
        summary: `Comprehensive academic and empirical research regarding ${prompt.slice(0, 60)}. Key historical documents, excavation field reports, and astronomical datasets validate the primary claims.`,
        keyClaims: [
          {
            claim: 'Primary inscriptions and foundational cylinders directly confirm the site geometry.',
            source: 'British Museum Tablet K.3657 / Cuneiform Inscription Index',
            isFact: true,
            confidence: 0.96
          },
          {
            claim: 'Comparative linguistic shifts correspond temporally with Bronze Age urban expansions.',
            source: 'Journal of Ancient Near Eastern Archaeology (Vol 44)',
            isFact: true,
            confidence: 0.92
          },
          {
            claim: 'Bitumen mortar composition matches unique regional bitumen pits of the lower Euphrates basin.',
            source: 'Geoarchaeological Chemical Analysis Bulletin',
            isFact: true,
            confidence: 0.98
          }
        ],
        sources: [
          {
            id: 'src-1',
            title: 'Excavations at Ancient Babylon and Borsippa',
            author: 'R. Koldewey & H. Rawlinson',
            year: 1914,
            reliability: 'historical_record'
          },
          {
            id: 'src-2',
            title: 'Ziggurats of Mesopotamia: Structural Survey and Stratigraphy',
            author: 'Prof. A. George',
            year: 2011,
            reliability: 'peer_reviewed'
          }
        ],
        notesMarkdown: `# Field Notes & Source Analysis\n\n* Critical examination reveals concordant stratigraphic layers.\n* No conflicting historical accounts documented in contemporary annals.`
      };
      return { data: mockResearch as unknown as T, tokensUsed: 850, costUsd: 0.002 };
    }

    // If prompt is for ContentBlueprint
    if (schemaDescription.includes('ContentBlueprint')) {
      const mockBlueprint = {
        title: prompt.slice(0, 70),
        hook: 'What if the most controversial structure in human history was actually discovered buried beneath Mesopotamian sands?',
        targetAudience: 'Inquisitive learners, history enthusiasts, and digital audiences seeking evidence-grounded explainers.',
        tone: 'Captivating, authoritative, and cinematic',
        language: 'English',
        estimatedDurationSec: 60,
        scriptBody: `Did ancient builders really reach for the heavens? For centuries, critics claimed the Tower of Babel was pure myth. But in the late nineteenth century, archaeologists unearthing the plains of modern Iraq uncovered a monumental ziggurat called Etemenanki—the foundation of heaven and earth. Stamped onto millions of baked clay bricks was the royal seal of King Nebuchadnezzar, detailing how he restored a collapsed tower from the distant past. Even more astonishing, ancient tablets depict a multicultural workforce speaking confounded tongues. History and archaeology don't just echo the narrative—they ground it in stone.`,
        spokenWordCount: 88,
        thumbnailConcepts: [
          {
            concept: 'Golden illuminated ancient tower piercing stormy clouds with bold archaeological headline',
            visualPrompt: 'Massive ancient Babylonian ziggurat tower glowing at twilight, dramatic volumetric clouds, cinematic lighting, 8k resolution',
            textOverlay: 'EVIDENCE FOUND'
          },
          {
            concept: 'Archaeologist inspecting ancient cuneiform royal brick with magnifying glass',
            visualPrompt: 'Close up of hands holding ancient cuneiform stamped clay brick, dust particles in sunbeam, museum lighting',
            textOverlay: 'NOT A MYTH'
          }
        ]
      };
      return { data: mockBlueprint as unknown as T, tokensUsed: 920, costUsd: 0.003 };
    }

    // If prompt is for Storyboard scenes
    if (schemaDescription.includes('Storyboard') || schemaDescription.includes('Scene')) {
      const mockScenes = [
        {
          sceneNumber: 1,
          startTimeSec: 0,
          durationSec: 8,
          narrationText: 'What if the most controversial structure in human history was actually discovered buried beneath Mesopotamian sands?',
          visualPrompt: 'Dramatic wide aerial establishing shot of sweeping desert dunes uncovering ancient stone ruins at sunset, volumetric light rays, hyper-detailed, 8k cinematic',
          mediaType: 'IMAGE_ONLY',
          textOverlay: 'A TOWER IN THE DUST',
          transition: 'fade'
        },
        {
          sceneNumber: 2,
          startTimeSec: 8,
          durationSec: 10,
          narrationText: 'For centuries, skeptics dismissed the narrative as pure mythology. But then came the excavation of Etemenanki.',
          visualPrompt: 'Historical 19th-century archaeology excavation site, workers uncovering massive baked clay brick foundations, dusty atmospheric lighting, historical documentary style',
          mediaType: 'VIDEO_CLIP',
          textOverlay: 'THE EXCAVATION',
          transition: 'crossfade'
        },
        {
          sceneNumber: 3,
          startTimeSec: 18,
          durationSec: 12,
          narrationText: 'Stamped onto millions of baked clay bricks was the royal cipher of King Nebuchadnezzar himself.',
          visualPrompt: 'Macro shot of ancient Mesopotamian mud brick stamped with sharp cuneiform script, side-raking lighting revealing intricate wedge impressions, museum quality',
          mediaType: 'IMAGE_ONLY',
          textOverlay: 'THE ROYAL SEAL',
          transition: 'crossfade'
        },
        {
          sceneNumber: 4,
          startTimeSec: 30,
          durationSec: 10,
          narrationText: 'Ancient stone steles explicitly document a diverse workforce from around the empire, united then scattered.',
          visualPrompt: 'Black stone stele carved with ancient workers lifting stone blocks, ancient Near Eastern bas-relief style, atmospheric gallery lighting',
          mediaType: 'VIDEO_CLIP',
          textOverlay: 'ALL TONGUES CONFUSED',
          transition: 'crossfade'
        },
        {
          sceneNumber: 5,
          startTimeSec: 40,
          durationSec: 10,
          narrationText: 'History and archaeology don\'t just echo the ancient accounts—they ground them into physical reality.',
          visualPrompt: 'Spectacular reconstruction of the grand Tower of Babel standing majestic against starlit night sky, golden lanterns illuminating terraces, ultra-detailed architectural render',
          mediaType: 'IMAGE_ONLY',
          textOverlay: 'HISTORY CONFIRMED',
          transition: 'fade'
        }
      ];
      return { data: mockScenes as unknown as T, tokensUsed: 1100, costUsd: 0.003 };
    }

    return { data: {} as T, tokensUsed: 200, costUsd: 0.001 };
  }
}

export class MockImageProvider implements IImageProvider {
  public name = 'mock-image';

  public async generateImage(
    _prompt: string,
    options: ImageGenerationOptions
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
    width: number;
    height: number;
    costUsd: number;
  }> {
    let width = 1280;
    let height = 720;

    if (options.aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    } else if (options.aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    }

    // Generate valid PNG with varying aesthetic hue
    const colors: [number, number, number][] = [
      [30, 41, 59],   // slate
      [24, 24, 27],   // zinc
      [69, 26, 3],    // warm amber/umber
      [15, 23, 42],   // deep navy
      [19, 78, 74]    // dark teal
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const buffer = createMockPngImage(width, height, color);

    return {
      buffer,
      mimeType: 'image/png',
      width,
      height,
      costUsd: 0.02
    };
  }
}

export class MockVoiceProvider implements IVoiceProvider {
  public name = 'mock-voice';

  public async generateSpeech(
    text: string,
    _options?: VoiceGenerationOptions
  ): Promise<{
    audioBuffer: Buffer;
    durationSec: number;
    mimeType: string;
    timestamps?: WordTimestamp[];
    costUsd: number;
  }> {
    // Normal speaking rate: ~140 words per minute -> 2.3 words/sec
    const words = text.trim().split(/\s+/).filter(Boolean);
    const calculatedDuration = Math.max(2.0, (words.length / 2.3) + 0.5);
    const durationSec = Math.round(calculatedDuration * 10) / 10;

    // Generate valid WAV audio
    const audioBuffer = createMockWavAudio(durationSec, 440);

    // Compute synthetic word timestamps
    const timestamps: WordTimestamp[] = [];
    let currentOffset = 0.2;
    const timePerWord = (durationSec - 0.4) / Math.max(1, words.length);

    for (const w of words) {
      timestamps.push({
        word: w,
        startTimeSec: Math.round(currentOffset * 100) / 100,
        endTimeSec: Math.round((currentOffset + timePerWord) * 100) / 100
      });
      currentOffset += timePerWord;
    }

    return {
      audioBuffer,
      durationSec,
      mimeType: 'audio/wav',
      timestamps,
      costUsd: 0.015
    };
  }
}

export class MockVideoProvider implements IVideoProvider {
  public name = 'mock-video';

  public async generateClip(
    _prompt: string,
    options: VideoGenerationOptions
  ): Promise<{
    videoBuffer: Buffer;
    durationSec: number;
    mimeType: string;
    costUsd: number;
  }> {
    // When in mock mode, video clips can be represented as high-res images
    // which the FFmpeg rendering engine animates into dynamic MP4 clips
    const durationSec = options.durationSec || 5;
    return {
      videoBuffer: Buffer.alloc(0),
      durationSec,
      mimeType: 'video/mp4',
      costUsd: 0.05
    };
  }
}
