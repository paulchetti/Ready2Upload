import { Asset, AssetType } from '@ready2upload/shared';
import { appDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';

interface AssetRow {
  id: string;
  project_id: string;
  scene_id: string | null;
  asset_type: string;
  provider: string;
  model: string;
  prompt: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  resolution: string | null;
  duration_sec: number | null;
  cost_usd: number;
  checksum: string;
  created_at: string;
}

function mapRowToAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    projectId: row.project_id,
    sceneId: row.scene_id || undefined,
    assetType: row.asset_type as AssetType,
    provider: row.provider,
    model: row.model,
    prompt: row.prompt || undefined,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    resolution: row.resolution || undefined,
    durationSec: row.duration_sec || undefined,
    costUsd: row.cost_usd,
    checksum: row.checksum,
    createdAt: row.created_at
  };
}

export class AssetRepository {
  public create(data: Omit<Asset, 'id' | 'createdAt'>): Asset {
    const id = uuidv4();
    const now = new Date().toISOString();

    const asset: Asset = {
      id,
      createdAt: now,
      ...data
    };

    appDatabase.run(
      `INSERT INTO assets (
        id, project_id, scene_id, asset_type, provider, model,
        prompt, file_path, file_name, mime_type, file_size_bytes,
        resolution, duration_sec, cost_usd, checksum, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset.id,
        asset.projectId,
        asset.sceneId || null,
        asset.assetType,
        asset.provider,
        asset.model,
        asset.prompt || null,
        asset.filePath,
        asset.fileName,
        asset.mimeType,
        asset.fileSizeBytes,
        asset.resolution || null,
        asset.durationSec !== undefined ? asset.durationSec : null,
        asset.costUsd,
        asset.checksum,
        asset.createdAt
      ]
    );

    return asset;
  }

  public findByProject(projectId: string): Asset[] {
    const rows = appDatabase.all<AssetRow>(
      'SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    return rows.map(mapRowToAsset);
  }

  public findById(id: string): Asset | undefined {
    const row = appDatabase.get<AssetRow>('SELECT * FROM assets WHERE id = ?', [id]);
    return row ? mapRowToAsset(row) : undefined;
  }

  public delete(id: string): void {
    appDatabase.run('DELETE FROM assets WHERE id = ?', [id]);
  }
}

export const assetRepository = new AssetRepository();
