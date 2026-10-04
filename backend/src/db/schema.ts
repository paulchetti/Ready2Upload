export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  content_type TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  target_duration_sec INTEGER NOT NULL,
  language TEXT NOT NULL,
  visual_style TEXT NOT NULL,
  tone TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  research_depth TEXT NOT NULL,
  status TEXT NOT NULL,
  autonomy_level TEXT NOT NULL,
  max_budget_usd REAL NOT NULL,
  current_step TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL,
  message TEXT NOT NULL,
  error_log TEXT,
  retry_count INTEGER NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_blueprints (
  project_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  tone TEXT NOT NULL,
  language TEXT NOT NULL,
  estimated_duration_sec INTEGER NOT NULL,
  script_body TEXT NOT NULL,
  spoken_word_count INTEGER NOT NULL,
  thumbnail_concepts_json TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS research_dossiers (
  project_id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_claims_json TEXT NOT NULL,
  sources_json TEXT NOT NULL,
  notes_markdown TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  scene_number INTEGER NOT NULL,
  start_time_sec REAL NOT NULL,
  duration_sec REAL NOT NULL,
  narration_text TEXT NOT NULL,
  visual_prompt TEXT NOT NULL,
  media_type TEXT NOT NULL,
  text_overlay TEXT,
  transition TEXT NOT NULL,
  visual_directive_json TEXT,
  structured_prompt_json TEXT,
  animation_type TEXT,
  sound_effects_json TEXT,
  music_intensity TEXT,
  character_id TEXT,
  location_id TEXT,
  object_id TEXT,
  style_id TEXT,
  image_asset_id TEXT,
  video_asset_id TEXT,
  audio_stem_id TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS continuity_profiles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  profile_type TEXT NOT NULL,
  name TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timelines (
  project_id TEXT PRIMARY KEY,
  timeline_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  scene_id TEXT,
  asset_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  resolution TEXT,
  duration_sec REAL,
  cost_usd REAL NOT NULL,
  checksum TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quality_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  overall_status TEXT NOT NULL,
  score INTEGER NOT NULL,
  checks_json TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cost_records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT NOT NULL,
  tokens_used INTEGER,
  compute_seconds REAL,
  cost_usd REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creator_profiles (
  id TEXT PRIMARY KEY,
  creator_name TEXT NOT NULL,
  brand_identity TEXT NOT NULL,
  preferred_language TEXT NOT NULL,
  preferred_tone TEXT NOT NULL,
  preferred_visual_style TEXT NOT NULL,
  default_voice_id TEXT NOT NULL,
  default_aspect_ratio TEXT NOT NULL,
  default_autonomy_level TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON workflow_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_continuity_project ON continuity_profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_project ON cost_records(project_id);
`;
