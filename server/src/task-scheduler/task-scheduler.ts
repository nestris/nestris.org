export abstract class Task {
  // Abstract method to be implemented by subclasses
  abstract run(): Promise<void>;
}

export enum TimeUnit {
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
}

export class TaskScheduler {
  private tasks: { taskClass: new () => Task; interval: number; id: NodeJS.Timeout }[] = [];

  // Method to register a task with a specified interval, passing the class constructor
  public schedule(taskClass: new () => Task, interval: number, unit: TimeUnit): void {


    // If task already scheduled, throw an error
    if (this.tasks.some(t => t.taskClass === taskClass)) {
      throw new Error(`Task of class ${taskClass.name} already scheduled`);
    }

    const task = new taskClass(); // Instantiate the task class
    const timeInMs = this.convertToMilliseconds(interval, unit);
    const taskId = setInterval(async () => {
      const startTime = Date.now();
      await task.run();
      const endTime = Date.now();
      console.log(`Finished running task ${taskClass.name} (period = ${interval} ${unit}) in ${endTime - startTime}ms`);
    }, timeInMs);

    this.tasks.push({
      taskClass,
      interval: timeInMs,
      id: taskId,
    });

    console.log(`Task ${taskClass.name} scheduled every ${interval} ${unit}`);
  }

  // Method to cancel a scheduled task using the class constructor
  public cancel(taskClass: new () => Task): void {
    const taskEntry = this.tasks.find(t => t.taskClass === taskClass);
    if (taskEntry) {
      clearInterval(taskEntry.id);
      this.tasks = this.tasks.filter(t => t.taskClass !== taskClass);
      console.log(`Task of class ${taskClass.name} cancelled`);
    }
  }

  // Convert the interval to milliseconds
  private convertToMilliseconds(interval: number, unit: TimeUnit): number {
    switch (unit) {
      case TimeUnit.SECONDS:
        return interval * 1000;
      case TimeUnit.MINUTES:
        return interval * 60 * 1000;
      case TimeUnit.HOURS:
        return interval * 60 * 60 * 1000;
      case TimeUnit.DAYS:
        return interval * 24 * 60 * 60 * 1000;
      default:
        throw new Error('Invalid time unit');
    }
  }
}

// Example of a Task implementation
export class ExampleTask extends Task {
  async run(): Promise<void> {
    // Simulate some asynchronous work
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}