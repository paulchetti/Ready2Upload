import { IImageProvider, ImageGenerationOptions } from '../provider.interface';
import { createMockPngImage } from '../mock/mock.media';

export class AIImageProvider implements IImageProvider {
  public name = 'ai-image';

  public async generateImage(
    prompt: string,
    options: ImageGenerationOptions
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
    width: number;
    height: number;
    costUsd: number;
  }> {
    let width = 800;
    let height = 450;

    if (options.aspectRatio === '9:16') {
      width = 450;
      height = 800;
    } else if (options.aspectRatio === '1:1') {
      width = 768;
      height = 768;
    }

    // Clean prompt for URL query
    const cleanPrompt = prompt.replace(/[^\w\s,.-]/gi, ' ').slice(0, 300);

    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mimeType = res.headers.get('content-type') || 'image/jpeg';

        if (buffer.length > 5000) {
          return {
            buffer,
            mimeType,
            width,
            height,
            costUsd: 0 // Free tier AI image generation
          };
        }
      }
    } catch (err: any) {
      console.warn(`[AIImageProvider] Pollinations generation skipped: ${err.message}. Using high-quality aesthetic canvas.`);
    }

    // Fallback: Generate aesthetic styled canvas
    const colors: [number, number, number][] = [
      [20, 30, 50],
      [15, 23, 42],
      [30, 27, 75],
      [19, 78, 74],
      [67, 20, 7]
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const fallbackBuffer = createMockPngImage(width, height, color);

    return {
      buffer: fallbackBuffer,
      mimeType: 'image/png',
      width,
      height,
      costUsd: 0
    };
  }
}
