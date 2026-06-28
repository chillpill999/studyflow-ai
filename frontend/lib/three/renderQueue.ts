export type RenderTaskPriority = 1 | 2 | 3 | 4;

export interface RenderTask {
  id: string;
  priority: RenderTaskPriority;
  callback: (delta: number, time: number) => void;
}

class RenderQueue {
  private tasks: Map<string, RenderTask> = new Map();
  private maxAllowedPriority: RenderTaskPriority = 4;

  public registerTask(id: string, priority: RenderTaskPriority, callback: (delta: number, time: number) => void) {
    this.tasks.set(id, { id, priority, callback });
  }

  public removeTask(id: string) {
    this.tasks.delete(id);
  }

  public setMaxPriority(priority: RenderTaskPriority) {
    this.maxAllowedPriority = priority;
  }

  public getMaxPriority(): RenderTaskPriority {
    return this.maxAllowedPriority;
  }

  public executeAll(delta: number, time: number) {
    this.tasks.forEach((task) => {
      // Only execute tasks that fit within the active performance priority budget
      if (task.priority <= this.maxAllowedPriority) {
        task.callback(delta, time);
      }
    });
  }

  public clear() {
    this.tasks.clear();
    this.maxAllowedPriority = 4;
  }
}

export const renderQueue = new RenderQueue();
export default renderQueue;
