import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { appDatabase } from './db/database';
import { projectRouter } from './routes/project.routes';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static project storage for video/audio/image previewing in the dashboard
app.use('/storage', express.static(config.storageDir));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ready2upload-studio-api',
    nodeEnv: config.nodeEnv,
    storageDir: config.storageDir,
    timestamp: new Date().toISOString()
  });
});

// Project API Routes
app.use('/api/projects', projectRouter);

export async function startServer(): Promise<void> {
  // Initialize SQLite database
  await appDatabase.initialize();
  console.log(`[DB] Database initialized successfully.`);

  app.listen(config.port, config.host, () => {
    console.log(`==================================================`);
    console.log(` Ready2Upload — AI Content Production Studio API`);
    console.log(` Running on: http://${config.host}:${config.port}`);
    console.log(` Client URL: ${config.clientUrl}`);
    console.log(` Storage:    ${config.storageDir}`);
    console.log(` Mode:       ${config.nodeEnv}`);
    console.log(`==================================================`);
  });
}

// Auto-start if invoked directly
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
