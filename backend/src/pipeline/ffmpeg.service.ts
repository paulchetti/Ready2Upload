import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { SceneAnimationType, QualityProfile } from '@ready2upload/shared';

// Initialize FFmpeg executable path
const binaryPath = config.media.ffmpegPath || (ffmpegStatic as string);
if (binaryPath) {
  ffmpeg.setFfmpegPath(binaryPath);
}

export interface RenderSceneOptions {
  imagePath: string;
  audioPath: string;
  durationSec: number;
  outputPath: string;
  width: number;
  height: number;
  fps?: number;
  animationType?: SceneAnimationType;
  qualityProfile?: QualityProfile;
}

export interface MixAudioOptions {
  videoInputPath: string;
  musicAudioPath: string;
  outputPath: string;
  musicVolume?: number; // 0.0 to 1.0 (e.g. 0.15 for ducking below narration)
}

export class FFmpegService {
  /**
   * Renders a discrete scene sub-clip with tailored Ken Burns camera motion and voice narration.
   */
  public async renderSceneVideo(options: RenderSceneOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const fps = options.fps || 30;
      const totalFrames = Math.max(1, Math.round(options.durationSec * fps));
      const anim = options.animationType || 'slow_zoom_in';

      // Build zoompan filter based on animation requirement
      let zoompanExpr = `zoompan=z='min(zoom+0.0012,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${options.width}x${options.height}:fps=${fps}`;

      if (anim === 'slow_zoom_out') {
        zoompanExpr = `zoompan=z='if(lte(zoom,1.0),1.0,max(1.0,1.15-0.0012*on))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${options.width}x${options.height}:fps=${fps}`;
      } else if (anim === 'pan_left') {
        zoompanExpr = `zoompan=z='1.12':d=${totalFrames}:x='max(0,(1-on/${totalFrames})*(iw-iw/zoom))':y='ih/2-(ih/zoom/2)':s=${options.width}x${options.height}:fps=${fps}`;
      } else if (anim === 'pan_right') {
        zoompanExpr = `zoompan=z='1.12':d=${totalFrames}:x='min(iw-iw/zoom,(on/${totalFrames})*(iw-iw/zoom))':y='ih/2-(ih/zoom/2)':s=${options.width}x${options.height}:fps=${fps}`;
      } else if (anim === 'vertical_movement') {
        zoompanExpr = `zoompan=z='1.10':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='min(ih-ih/zoom,(on/${totalFrames})*(ih-ih/zoom))':s=${options.width}x${options.height}:fps=${fps}`;
      } else if (anim === 'static') {
        zoompanExpr = `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`;
      }

      const vf = [
        `scale=${options.width}*2:${options.height}*2`,
        zoompanExpr,
        'format=yuv420p'
      ].join(',');

      const preset = options.qualityProfile === 'DRAFT' ? 'ultrafast' : (options.qualityProfile === 'HIGH' ? 'medium' : 'fast');
      const crf = options.qualityProfile === 'DRAFT' ? '28' : '22';

      ffmpeg()
        .input(options.imagePath)
        .loop(options.durationSec)
        .input(options.audioPath)
        .outputOptions([
          `-vf ${vf}`,
          '-c:v libx264',
          `-preset ${preset}`,
          `-crf ${crf}`,
          '-c:a aac',
          '-b:a 192k',
          '-shortest',
          '-movflags +faststart'
        ])
        .output(options.outputPath)
        .on('end', () => resolve(options.outputPath))
        .on('error', (err) => reject(new Error(`FFmpeg scene render error: ${err.message}`)))
        .run();
    });
  }

  /**
   * Concatenates discrete scene sub-clips into a unified video.
   */
  public async concatenateScenes(sceneVideoPaths: string[], outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const listFilePath = path.join(path.dirname(outputPath), 'concat_list.txt');
      const fileEntries = sceneVideoPaths
        .map((p) => `file '${p.replace(/\\/g, '/')}'`)
        .join('\n');

      fs.writeFileSync(listFilePath, fileEntries);

      ffmpeg()
        .input(listFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy', '-movflags +faststart'])
        .output(outputPath)
        .on('end', () => {
          if (fs.existsSync(listFilePath)) {
            fs.unlinkSync(listFilePath);
          }
          resolve(outputPath);
        })
        .on('error', (err) => reject(new Error(`FFmpeg concat error: ${err.message}`)))
        .run();
    });
  }

  /**
   * Mixes background music (ducked) under narration track.
   */
  public async mixBackgroundMusic(options: MixAudioOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const musicVol = options.musicVolume !== undefined ? options.musicVolume : 0.14;

      ffmpeg()
        .input(options.videoInputPath)
        .input(options.musicAudioPath)
        .complexFilter([
          `[1:a]volume=${musicVol}[bg]`,
          '[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]'
        ])
        .outputOptions([
          '-c:v copy',
          '-map 0:v',
          '-map [aout]',
          '-c:a aac',
          '-b:a 192k',
          '-movflags +faststart'
        ])
        .output(options.outputPath)
        .on('end', () => resolve(options.outputPath))
        .on('error', (err) => reject(new Error(`FFmpeg audio mix error: ${err.message}`)))
        .run();
    });
  }

  /**
   * Normalizes audio loudness to standard EBU R128 (-14 LUFS for web/YouTube).
   */
  public async applyLoudnessNormalization(inputPath: string, outputPath: string, targetLufs: number = -14): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .outputOptions([
          '-c:v copy',
          `-af loudnorm=I=${targetLufs}:LRA=11:TP=-1.5`,
          '-c:a aac',
          '-b:a 192k'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(new Error(`Audio normalization error: ${err.message}`)))
        .run();
    });
  }
}

export const ffmpegService = new FFmpegService();
