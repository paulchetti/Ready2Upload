import { EventEmitter } from 'events';
import { WorkflowEvent } from '@ready2upload/shared';

export class WorkflowEventBus extends EventEmitter {
  public emitEvent(event: WorkflowEvent): void {
    this.emit('workflow_event', event);
    this.emit(`project:${event.projectId}`, event);
  }

  public subscribeToProject(projectId: string, callback: (event: WorkflowEvent) => void): () => void {
    const eventName = `project:${projectId}`;
    this.on(eventName, callback);
    return () => this.off(eventName, callback);
  }

  public subscribeAll(callback: (event: WorkflowEvent) => void): () => void {
    this.on('workflow_event', callback);
    return () => this.off('workflow_event', callback);
  }
}

export const eventBus = new WorkflowEventBus();
