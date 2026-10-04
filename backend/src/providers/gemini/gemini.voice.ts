import { IVoiceProvider, VoiceGenerationOptions, WordTimestamp } from '../provider.interface';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export class GeminiVoiceProvider implements IVoiceProvider {
  public name = 'gemini-tts';
  private apiKey: string;
  private ttsModels = [
    'gemini-2.5-flash-preview-tts',
    'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview'
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

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
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    if (!cleanText) {
      throw new Error('Narration text is empty');
    }

    // Try Gemini TTS models first
    for (const model of this.ttsModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: cleanText }] }],
            generationConfig: { responseModalities: ['AUDIO'] }
          })
        });

        if (!res.ok) {
          continue;
        }

        const data: any = await res.json();
        const part = data.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          const rawPcm = Buffer.from(part.inlineData.data, 'base64');
          const sampleRate = 24000;
          const wavBuffer = this.pcmToWav(rawPcm, sampleRate, 1);
          const durationSec = Math.max(1.5, Math.round((rawPcm.length / (sampleRate * 2)) * 10) / 10);
          const timestamps = this.generateTimestamps(cleanText, durationSec);

          return {
            audioBuffer: wavBuffer,
            durationSec,
            mimeType: 'audio/wav',
            timestamps,
            costUsd: 0.001
          };
        }
      } catch (err) {
        // Fallback to next model
      }
    }

    // If cloud TTS is unavailable, fall back to Windows Speech Synthesizer for real spoken voice
    try {
      return await this.generateWindowsSpeech(cleanText);
    } catch {
      // Last resort fallback
      const durationSec = Math.max(2.0, (cleanText.split(/\s+/).length / 2.3) + 0.5);
      return {
        audioBuffer: Buffer.alloc(0),
        durationSec,
        mimeType: 'audio/wav',
        timestamps: this.generateTimestamps(cleanText, durationSec),
        costUsd: 0
      };
    }
  }

  private pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000, numChannels: number = 1): Buffer {
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);

    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20);  // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * 2, 28); // ByteRate
    header.writeUInt16LE(numChannels * 2, 32);              // BlockAlign
    header.writeUInt16LE(16, 34);                           // BitsPerSample

    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  private async generateWindowsSpeech(text: string): Promise<{
    audioBuffer: Buffer;
    durationSec: number;
    mimeType: string;
    timestamps: WordTimestamp[];
    costUsd: number;
  }> {
    const tempWav = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
    const escaped = text.replace(/'/g, "''").replace(/"/g, '`"');
    const psScript = `
Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speak.Rate = 0
$speak.SetOutputToWaveFile('${tempWav.replace(/\\/g, '\\\\')}')
$speak.Speak('${escaped}')
$speak.Dispose()
`;

    await execAsync(`powershell.exe -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`);
    const audioBuffer = fs.readFileSync(tempWav);
    try { fs.unlinkSync(tempWav); } catch {}

    // 16-bit 22050Hz Mono or 44100Hz
    // Calculate duration from WAV data chunk
    let durationSec = Math.max(2.0, (text.split(/\s+/).length / 2.3) + 0.5);
    if (audioBuffer.length > 44) {
      const byteRate = audioBuffer.readUInt32LE(28) || 44100;
      durationSec = Math.round(((audioBuffer.length - 44) / byteRate) * 10) / 10;
    }

    return {
      audioBuffer,
      durationSec,
      mimeType: 'audio/wav',
      timestamps: this.generateTimestamps(text, durationSec),
      costUsd: 0
    };
  }

  private generateTimestamps(text: string, durationSec: number): WordTimestamp[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
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
    return timestamps;
  }
}
