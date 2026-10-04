import { WorkflowTask, AgentName, TaskStatus } from '@ready2upload/shared';
import { appDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';

interface TaskRow {
  id: string;
  project_id: string;
  agent_name: string;
  task_type: string;
  status: string;
  progress: number;
  message: string;
  error_log: string | null;
  retry_count: number;
  started_at: string | null;
  completed_at: string | null;
}

function mapRowToTask(row: TaskRow): WorkflowTask {
  return {
    id: row.id,
    projectId: row.project_id,
    agentName: row.agent_name as AgentName,
    taskType: row.task_type,
    status: row.status as TaskStatus,
    progress: row.progress,
    message: row.message,
    errorLog: row.error_log || undefined,
    retryCount: row.retry_count,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined
  };
}

export class TaskRepository {
  public create(data: {
    projectId: string;
    agentName: AgentName;
    taskType: string;
    message?: string;
  }): WorkflowTask {
    const id = uuidv4();
    const task: WorkflowTask = {
      id,
      projectId: data.projectId,
      agentName: data.agentName,
      taskType: data.taskType,
      status: 'PENDING',
      progress: 0,
      message: data.message || `Initialized ${data.agentName} task`,
      retryCount: 0,
      startedAt: new Date().toISOString()
    };

    appDatabase.run(
      `INSERT INTO workflow_tasks (
        id, project_id, agent_name, task_type, status,
        progress, message, error_log, retry_count, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.projectId,
        task.agentName,
        task.taskType,
        task.status,
        task.progress,
        task.message,
        null,
        task.retryCount,
        task.startedAt || null,
        null
      ]
    );

    return task;
  }

  public update(id: string, updates: Partial<WorkflowTask>): void {
    const existing = appDatabase.get<TaskRow>('SELECT * FROM workflow_tasks WHERE id = ?', [id]);
    if (!existing) return;

    appDatabase.run(
      `UPDATE workflow_tasks SET
        status = COALESCE(?, status),
        progress = COALESCE(?, progress),
        message = COALESCE(?, message),
        error_log = COALESCE(?, error_log),
        retry_count = COALESCE(?, retry_count),
        completed_at = COALESCE(?, completed_at)
      WHERE id = ?`,
      [
        updates.status || null,
        updates.progress !== undefined ? updates.progress : null,
        updates.message || null,
        updates.errorLog || null,
        updates.retryCount !== undefined ? updates.retryCount : null,
        updates.completedAt || null,
        id
      ]
    );
  }

  public findByProject(projectId: string): WorkflowTask[] {
    const rows = appDatabase.all<TaskRow>(
      'SELECT * FROM workflow_tasks WHERE project_id = ? ORDER BY started_at ASC',
      [projectId]
    );
    return rows.map(mapRowToTask);
  }
}

export const taskRepository = new TaskRepository();
