import { AgentName, WorkflowTask } from '@ready2upload/shared';
import { taskRepository } from '../db/task.repository';
import { eventBus } from './orchestrator/event-bus';

export interface WorkflowContext {
  projectId: string;
  autonomyLevel: 'LEVEL_1_ASSISTED' | 'LEVEL_2_PRODUCTION' | 'LEVEL_3_AUTONOMOUS';
  maxBudgetUsd: number;
}

export abstract class BaseAgent {
  public abstract readonly name: AgentName;

  protected async executeTask<T>(
    projectId: string,
    taskType: string,
    description: string,
    handler: (task: WorkflowTask, reportProgress: (progress: number, message: string) => void) => Promise<T>
  ): Promise<T> {
    const task = taskRepository.create({
      projectId,
      agentName: this.name,
      taskType,
      message: description
    });

    eventBus.emitEvent({
      type: 'TASK_STARTED',
      projectId,
      taskId: task.id,
      agentName: this.name,
      status: 'RUNNING',
      progress: 0,
      message: description,
      timestamp: new Date().toISOString()
    });

    const reportProgress = (progress: number, message: string) => {
      taskRepository.update(task.id, {
        progress,
        message,
        status: 'RUNNING'
      });
      eventBus.emitEvent({
        type: 'TASK_PROGRESS',
        projectId,
        taskId: task.id,
        agentName: this.name,
        progress,
        message,
        timestamp: new Date().toISOString()
      });
    };

    try {
      const result = await handler(task, reportProgress);

      taskRepository.update(task.id, {
        progress: 100,
        status: 'COMPLETED',
        message: `Completed: ${description}`,
        completedAt: new Date().toISOString()
      });

      eventBus.emitEvent({
        type: 'TASK_COMPLETED',
        projectId,
        taskId: task.id,
        agentName: this.name,
        status: 'COMPLETED',
        progress: 100,
        message: `Completed: ${description}`,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (err: any) {
      taskRepository.update(task.id, {
        status: 'FAILED',
        errorLog: err.stack || err.message,
        message: `Failed: ${err.message}`
      });

      eventBus.emitEvent({
        type: 'TASK_FAILED',
        projectId,
        taskId: task.id,
        agentName: this.name,
        status: 'FAILED',
        message: err.message,
        timestamp: new Date().toISOString()
      });

      throw err;
    }
  }
}
