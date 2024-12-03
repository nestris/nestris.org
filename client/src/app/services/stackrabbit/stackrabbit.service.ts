import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

const NUM_WORKERS = 2;

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

  private workerInitialized$: BehaviorSubject<boolean>[] = [];
  private workerMessage$: Subject<WorkerResponse> = new Subject();

  private workers: Worker[] = [];

  private idCount: number = 0;

  constructor() {

    if (typeof Worker === 'undefined') {
      console.error('Web workers are not supported in this environment.');
      return;
    }

    // Populate the workerInitialized$ array
    for (let i = 0; i < NUM_WORKERS; i++) {
      this.workerInitialized$.push(new BehaviorSubject<boolean>(false));
    }

    // Create the workers and set up message handling for each worker
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = new Worker(new URL('./stackrabbit.worker', import.meta.url));
      worker.onmessage = ({ data }) => {
        if (data === "INIT") {
          this.workerInitialized$[i].next(true);
          console.log(`Worker ${i} initialized`);
        }
        else this.workerMessage$.next(data as WorkerResponse);
      };
      this.workers.push(worker);
    }

    console.log(`Created ${NUM_WORKERS} workers`);
  }


  /**
   * Wait for the worker to be initialized
   * @param workerIndex The index of the worker to wait for
   * @returns A promise that resolves when the worker is initialized
   */
  private async waitForWorkerToBeInitialized(workerIndex: number): Promise<void> {

    if (this.workerInitialized$[workerIndex].getValue()) return Promise.resolve(); // Worker is already initialized

    return new Promise((resolve, reject) => {
        const subscription = this.workerInitialized$[workerIndex].subscribe({
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

  /**
   * Wait for a message with a specific ID
   * @param id The ID of the message to wait for
   * @returns A promise that resolves with the message
   */
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

  /**
   * Make a request to the worker
   * @param endpoint The name of the function to call. This must be bound in wasm.cpp
   * @param parameters The parameters in Stackrabbit string format
   * @returns A promise that resolves with the raw Stackrabbit response
   */
  private async makeRequest(endpoint: string, parameters: string): Promise<any> {

    // Unique ID for the request
    const id = this.idCount++;

    // Round-robin to select a worker
    const workerIndex = id % NUM_WORKERS;

    console.log(`Making request with ID: ${id} on worker ${workerIndex}`);

    // Wait for the worker to be initialized
    await this.waitForWorkerToBeInitialized(workerIndex);

    // Start waiting for the response
    const awaitingResponse = this.waitForMessage(id);
    
    // Send the request to the worker
    const message: WorkerRequest = { id, endpoint, parameters };
    this.workers[workerIndex].postMessage(message);
    console.log(`Sent message with ID: ${id}, endpoint: ${endpoint}, parameters: ${parameters}`);

    const response = await awaitingResponse;
    console.log(`Received response for request with ID: ${id}`, response);
  
    return response;
  }

  // Example function that makes a test request
  public async makeTestRequest() {
    const msg = "00000000000000000000000000000000000000000000000000000000000000000011100000001110000000111100000111110000011110000011111100011101110011101110001111111000111111100111111110011111111001111111101111111110|18|2|5|0|X...|343|3|";
    return await this.makeRequest("getTopMovesHybrid", msg);
  }
}


