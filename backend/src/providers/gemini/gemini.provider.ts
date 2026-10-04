import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILLMProvider, LLMGenerationOptions } from '../provider.interface';

const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash'
];

export class GeminiLLMProvider implements ILLMProvider {
  public name = 'gemini';
  private client: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-3.5-flash-lite') {
    this.modelName = modelName;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  public async generateText(
    prompt: string,
    options?: LLMGenerationOptions
  ): Promise<{ text: string; tokensUsed: number; costUsd: number }> {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const modelsToTry = [this.modelName, ...FALLBACK_MODELS.filter(m => m !== this.modelName)];
    let lastError: any = null;

    for (const modelCandidate of modelsToTry) {
      try {
        const model = this.client.getGenerativeModel({
          model: modelCandidate,
          systemInstruction: options?.systemPrompt
        });

        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 8192
          }
        });

        const text = response.response.text();
        const tokenEstimate = Math.ceil((prompt.length + text.length) / 4);
        const costUsd = (tokenEstimate / 1_000_000) * 0.15;

        return { text, tokensUsed: tokenEstimate, costUsd };
      } catch (err: any) {
        lastError = err;
        // If transient server error (503/429), try next model candidate
        if (err.status === 503 || err.status === 429 || err.status === 404) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('All Gemini model fallbacks failed');
  }

  public async generateJSON<T>(
    prompt: string,
    schemaDescription: string,
    options?: LLMGenerationOptions
  ): Promise<{ data: T; tokensUsed: number; costUsd: number }> {
    const fullPrompt = `${prompt}\n\nYou MUST return raw, valid JSON only. Adhere strictly to this schema:\n${schemaDescription}\nDo not wrap in markdown or backticks. Return pure JSON.`;
    const { text, tokensUsed, costUsd } = await this.generateText(fullPrompt, {
      ...options,
      temperature: 0.2 // lower temperature for deterministic JSON output
    });

    try {
      // Clean possible markdown code fences if model included them
      let cleaned = text.trim();
      const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1].trim();
      } else {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      }
      const data = JSON.parse(cleaned) as T;
      return { data, tokensUsed, costUsd };
    } catch (err: any) {
      throw new Error(`Failed to parse Gemini JSON response: ${err.message}. Raw output: ${text.slice(0, 200)}`);
    }
  }
}
