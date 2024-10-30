import { BehaviorSubject, Observable } from 'rxjs';

export abstract class Action {
  private isRunningSubject = new BehaviorSubject<boolean>(false);
  public isRunning$: Observable<boolean> = this.isRunningSubject.asObservable();

  protected abstract run(): Promise<void>;

  public async runIfNotRunning(): Promise<void> {
    // If already running, don't start another execution
    if (this.isRunningSubject.value) {
      return;
    }

    try {
      this.isRunningSubject.next(true);
      await this.run();
    } finally {
      this.isRunningSubject.next(false);
    }
  }

  public isRunning(): Observable<boolean> {
    return this.isRunningSubject.asObservable();
  }
}