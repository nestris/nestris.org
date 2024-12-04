import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { INPUT_SPEED_TO_TIMELINE, InputSpeed } from 'src/app/shared/models/input-speed';
import { BinaryTranscoder } from 'src/app/shared/network/tetris-board-transcoding/binary-transcoder';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';

// Number of web workers to create, to be used for parallel processing round-robin style
const NUM_WORKERS = 2;

// Define the type for the messages sent to each worker
interface WorkerRequest {
  id: number;
  endpoint: string;
  parameters: string;
}

// Define the type for the responses from each worker
interface WorkerResponse {
  id: number;
  result: any;
}

export interface StackrabbitParams {
  board: TetrisBoard;
  level: number;
  lines: number;
  currentPiece: TetrominoType;
  nextPiece: TetrominoType | null;
  inputSpeed: InputSpeed;
  playoutDepth: number;
}

export interface OptionalStackrabbitParams {
  board: TetrisBoard;
  level?: number;
  lines?: number;
  currentPiece: TetrominoType;
  nextPiece: TetrominoType | null;
  inputSpeed?: InputSpeed;
  playoutDepth?: number;
}

export interface TopMovesHybridResponse {
  nextBox?: {
    firstPlacement: MoveableTetromino,
    secondPlacement: MoveableTetromino,
    score: number
  }[],
  noNextBox: {
    firstPlacement: MoveableTetromino,
    score: number
  }[]
}

export class StackrabbitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StackrabbitError";
  }
}

/**
 * Service for interacting with the Stackrabbit WebAssembly module using web workers. Make non-blocking requests
 * to the Stackrabbit module and receive responses asynchronously through parallelized web workers that interface
 * with WASM Stackrabbit.
 */
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
   * Wait for the worker with corresponding index to be initialized
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
                    resolve(value.result); // Resolve the promise
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
   * Make a request to stackrabbit. This selects a worker using round-robin strategy, sends the request,
   * and waits for the response
   * @param endpoint The name of the function to call. This must be bound in wasm.cpp
   * @param parameters The parameters in Stackrabbit string format
   * @returns A promise that resolves with the raw Stackrabbit response
   * @throws StackrabbitError if the request is invalid
   */
  private async makeRequest(endpoint: string, parameters: string): Promise<any> {

    // Unique ID for the request to match responses
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

    const response = await awaitingResponse;
  
    return response
  }

  public async getTopMovesHybrid(optionalParams: OptionalStackrabbitParams): Promise<TopMovesHybridResponse> {

    const params: StackrabbitParams = Object.assign(
    { // Default parameters
      level: 18,
      lines: 0,
      inputSpeed: InputSpeed.HZ_30,
      playoutDepth: 3
    }, optionalParams);

    // Encode the board to a string of 1s and 0s
    let boardString = BinaryTranscoder.encode(params.board, true);

    // Playout count is 7^depth
    const playoutCount = Math.pow(7, params.playoutDepth);

    if (params.currentPiece === TetrominoType.ERROR_TYPE) {
      throw new StackrabbitError("Invalid current piece");
    }

    if (params.nextPiece === TetrominoType.ERROR_TYPE) {
      throw new StackrabbitError("Invalid next piece");
    }

    // Convert the parameters to a string
    const currentPiece: number = params.currentPiece;
    const nextPiece: number = (params.nextPiece === null) ? -1 : params.nextPiece;
    const inputFrameTimeline = INPUT_SPEED_TO_TIMELINE[params.inputSpeed];

    // Construct the parameters string
    const parameters = `${boardString}|${params.level}|${params.lines}|${currentPiece}|${nextPiece}|${inputFrameTimeline}|${playoutCount}|${params.playoutDepth}|`;

    // Make the request
    const response = await this.makeRequest("getTopMovesHybrid", parameters);

    // Decode the response, and if it is invalid, throw an error

    try {
      
      const noNextBox = (response['noNextBox'] as any[]).map((move: any) => { return {
        firstPlacement: MoveableTetromino.fromStackRabbitPose(params.currentPiece, move['firstPlacement'][0], move['firstPlacement'][1], move['firstPlacement'][2]),
        score: move['playoutScore'] as number
      }});

      const nextPiece = params.nextPiece;
      const nextBox = nextPiece === null ? [] : (response['nextBox'] as any[]).map((move: any) => { return {
        firstPlacement: MoveableTetromino.fromStackRabbitPose(params.currentPiece, move['firstPlacement'][0] as number, move['firstPlacement'][1] as number, move['firstPlacement'][2] as number),
        secondPlacement: MoveableTetromino.fromStackRabbitPose(nextPiece, move['secondPlacement'][0] as number, move['secondPlacement'][1] as number, move['secondPlacement'][2] as number),
        score: move['playoutScore'] as number
      }});

      return { nextBox, noNextBox };

    } catch (e) {
      throw new StackrabbitError(`Invalid Stackrabbit response: ${e}`);
    }

  }

  // Example function that makes a test request
  public async makeTestRequest() {
    return await this.getTopMovesHybrid({
      board: new TetrisBoard(),
      currentPiece: TetrominoType.I_TYPE,
      nextPiece: TetrominoType.J_TYPE
    });
  }
}


