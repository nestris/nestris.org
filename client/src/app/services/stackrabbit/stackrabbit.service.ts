import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, last, lastValueFrom, Subject } from 'rxjs';

interface WorkerRequest {
  id: number;
  endpoint: string;
  parameters: string;
}

interface WorkerResponse {
  id: number;
  result: any;
}

@Injectable({
  providedIn: 'root'
})
export class StackrabbitService {

  private workerInitialized$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private workerMessage$: Subject<WorkerResponse> = new Subject();

  private worker!: Worker;

  private idCount: number = 0;

  private async waitForWorkerToBeInitialized(): Promise<void> {

    if (this.workerInitialized$.getValue()) return Promise.resolve(); // Worker is already initialized

    return new Promise((resolve, reject) => {
        const subscription = this.workerInitialized$.subscribe({
            next: (value) => {
                if (value) {
                    subscription.unsubscribe(); // Stop listening
                    resolve(); // Resolve the promise
                }
            },
            error: (err) => {
                subscription.unsubscribe(); // Cleanup
                reject(err); // Reject the promise on error
            }
        });
    });
  }

  private async waitForMessage(id: number) {
    return new Promise((resolve, reject) => {
        const subscription = this.workerMessage$.subscribe({
            next: (value) => {
                if (value.id === id) {
                    subscription.unsubscribe(); // Stop listening
                    resolve(value); // Resolve the promise
                }
            },
            error: (err) => {
                subscription.unsubscribe(); // Cleanup
                reject(err); // Reject the promise on error
            }
        });
    });
}

  constructor() {

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./stackrabbit.worker', import.meta.url));
      console.log('worker created', this.worker);
      this.worker.onmessage = ({ data }) => {
        if (data === "INIT") this.init();
        else this.workerMessage$.next(data as WorkerResponse);
      };
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
      console.error('Web workers are not supported in this environment.');
    }

    this.workerMessage$.subscribe((message) => {
      console.log('worker message', message);
    });
  }

  async init() {

    this.workerInitialized$.next(true);
    console.log('worker initialized');
  }

  private async makeRequest(endpoint: string, parameters: string): Promise<any> {

    // Unique ID for the request
    const id = this.idCount++;

    // Wait for the worker to be initialized
    await this.waitForWorkerToBeInitialized();

    // Start waiting for the response
    const awaitingResponse = this.waitForMessage(id);
    
    // Send the request to the worker
    const message: WorkerRequest = { id, endpoint, parameters };
    this.worker.postMessage(message);
    console.log(`Sent message with ID: ${id}, endpoint: ${endpoint}, parameters: ${parameters}`);

    const response = await awaitingResponse;
    console.log(`Received response for request with ID: ${id}`, response);
  
    return response;
  }

  public async makeTestRequest() {
    const msg = "00000000000000000000000000000000000000000000000000000000000000000011100000001110000000111100000111110000011110000011111100011101110011101110001111111000111111100111111110011111111001111111101111111110|18|2|5|0|X...|";
    return await this.makeRequest("getTopMovesHybrid", msg);
  }
}


