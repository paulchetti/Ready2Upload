import fs from 'fs';
import path from 'path';
import { config } from '../config';

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = config.storageDir;
    this.ensureDirectory(this.baseDir);
    this.ensureDirectory(path.join(this.baseDir, 'projects'));
    this.ensureDirectory(path.join(this.baseDir, 'temp'));
    this.ensureDirectory(path.join(this.baseDir, 'cache'));
  }

  public ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  public getProjectDir(projectId: string): string {
    const projectDir = path.join(this.baseDir, 'projects', projectId);
    this.ensureDirectory(projectDir);
    this.ensureDirectory(path.join(projectDir, 'assets', 'images'));
    this.ensureDirectory(path.join(projectDir, 'assets', 'video'));
    this.ensureDirectory(path.join(projectDir, 'assets', 'audio'));
    this.ensureDirectory(path.join(projectDir, 'renders'));
    this.ensureDirectory(path.join(projectDir, 'content'));
    this.ensureDirectory(path.join(projectDir, 'research'));
    return projectDir;
  }

  public getProjectImagesDir(projectId: string): string {
    const dir = path.join(this.getProjectDir(projectId), 'assets', 'images');
    this.ensureDirectory(dir);
    return dir;
  }

  public getProjectAudioDir(projectId: string): string {
    const dir = path.join(this.getProjectDir(projectId), 'assets', 'audio');
    this.ensureDirectory(dir);
    return dir;
  }

  public getProjectVideoDir(projectId: string): string {
    const dir = path.join(this.getProjectDir(projectId), 'assets', 'video');
    this.ensureDirectory(dir);
    return dir;
  }

  public getProjectRendersDir(projectId: string): string {
    const dir = path.join(this.getProjectDir(projectId), 'renders');
    this.ensureDirectory(dir);
    return dir;
  }

  public getProjectContentDir(projectId: string): string {
    const dir = path.join(this.getProjectDir(projectId), 'content');
    this.ensureDirectory(dir);
    return dir;
  }

  public getProjectResearchDir(projectId: string): string {
    const dir = path.join(this.getProjectDir(projectId), 'research');
    this.ensureDirectory(dir);
    return dir;
  }

  public sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  public writeProjectFile(projectId: string, relativePath: string, content: string | Buffer): string {
    const fullPath = path.join(this.getProjectDir(projectId), relativePath);
    this.ensureDirectory(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content);
    return fullPath;
  }

  public readProjectFile(projectId: string, relativePath: string): Buffer {
    const fullPath = path.join(this.getProjectDir(projectId), relativePath);
    return fs.readFileSync(fullPath);
  }

  public fileExists(projectId: string, relativePath: string): boolean {
    const fullPath = path.join(this.getProjectDir(projectId), relativePath);
    return fs.existsSync(fullPath);
  }

  public deleteProjectStorage(projectId: string): void {
    const projectDir = path.join(this.baseDir, 'projects', projectId);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  }
}

export const storageService = new StorageService();
