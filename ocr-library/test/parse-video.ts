import { VideoSource } from '../ocr/state-machine/video-source';
import { RGBColor } from '../shared/tetris/tetromino-colors';
import { Frame, RGBFrame } from '../ocr/util/frame';

export async function fetchAPI(method: string, endpoint: string): Promise<any> {
    const response = await fetch(`http://localhost:5001/${endpoint}`, 
        {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}


/**
 * A video source that fetches frames from the API. Must be initialized before use.
 */
export class TestVideoSource extends VideoSource {

    private numFrames!: number;
    private width!: number;
    private height!: number;
    private currentFrameIndex: number = 0;

    constructor(private readonly testcase: string) {
        super();
        this.testcase = testcase;
    }

    async init(): Promise<void> {
        // Set the video to use the specified testcase
        await fetchAPI('POST', `set/${this.testcase}`);

        // Fetch video details
        const { testcase: fetchedTestcase, frames: numFrames, width, height } = await fetchAPI('GET', 'info');
        if (fetchedTestcase !== this.testcase) throw new Error(`Failed to set testcase to ${this.testcase}, got ${fetchedTestcase}`);

        this.numFrames = numFrames;
        this.width = width;
        this.height = height;
    }

    /**
     * Gets the number of frames in the video.
     * @returns The number of frames in the video
     */
    getNumFrames(): number {
        return this.numFrames;
    }

    /**
     * Fetches the next frame from the video through the API.
     * @returns A promise that resolves with the next frame
     */
    override async getNextFrame(): Promise<Frame> {

        if (this.currentFrameIndex >= this.numFrames) {
            throw new Error('No more frames to fetch');
        }

        const frame = await this.getFrame(this.currentFrameIndex);
        this.currentFrameIndex++;
        return frame;
    }

    /**
     * Fetches the frame at the specified index from the API.
     * @param index The index of the frame to fetch
     * @returns A promise that resolves with the frame
     */
    async getFrame(index: number): Promise<Frame> {

        if (index < 0 || index >= this.numFrames) {
            throw new Error(`Invalid frame index ${index}, video has ${this.numFrames} frames`);
        }

        // Fetch frame data from API
        const { image } = await fetchAPI('GET', `frame/${index}`);

        // Image is a 2d list of [r,g,b]. Convert image data to 2D RGB array
        const frame: RGBColor[][] = [];
        for (let y = 0; y < this.height; y++) {
            const row: RGBColor[] = [];
            for (let x = 0; x < this.width; x++) {
                const [r, g, b] = image[y][x];
                row.push(new RGBColor(r, g, b));
            }
            frame.push(row);
        }

        return new RGBFrame(frame);
    }
}