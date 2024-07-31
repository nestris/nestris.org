import { spawn, execSync } from 'child_process';
import { RGBColor } from '../shared/tetris/tetromino-colors';

/**
 * Gets the width and height of a video file.
 * @param filePath Path to the video file
 * @returns An object with the width and height of the video
 */
const getVideoDimensions = (filePath: string): { width: number, height: number } => {
    const ffprobeOutput = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${filePath}`).toString().trim();
    const [width, height] = ffprobeOutput.split('x').map(Number);
    return { width, height };
};

/**
 * Parses a video file and returns an array of 2D RGB arrays, where each 2D array represents a frame.
 * @param videoPath Path to the video file
 * @param startFrame Specifies the first frame to process, inclusive. Default is 0.
 * @param endFrame Specifies the last frame to process, exclusive. If not provided, all frames after startFrame will be processed.
 * @returns A promise that resolves with the array of 2D RGB arrays
 */
export function parseVideo(videoPath: string, startFrame: number = 0, endFrame?: number): Promise<RGBColor[][][]> {
    return new Promise((resolve, reject) => {
        // Get video dimensions
        const { width, height } = getVideoDimensions(videoPath);
        const frameSize = width * height * 3; // full HD in RGB (24bpp)
        const buffer = Buffer.alloc(frameSize + 1024 * 1024); // frameSize + 1MB headroom
        let bufPos = 0;
        let frame = 0;

        // Construct the ffmpeg command
        const ffmpegArgs = [
            '-i', videoPath,
            '-f', 'rawvideo',
            '-pix_fmt', 'rgb24',
            '-vf', `select='gte(n\\,${startFrame})${endFrame !== undefined ? `+lt(n\\,${endFrame})` : ''}'`,
            'pipe:1' // ffmpeg will output the data to stdout
        ];

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        const frames: RGBColor[][][] = [];

        ffmpeg.stdout.on('data', (chunk: Buffer) => {
            chunk.copy(buffer, bufPos);
            bufPos += chunk.length;

            // We have a complete frame (and possibly a bit of the next frame) in the buffer
            if (bufPos >= frameSize) {
                const rawPixels: Buffer = buffer.subarray(0, frameSize);
                // Convert raw pixels to 2D RGB array
                const rgbArray: RGBColor[][] = [];
                for (let y = 0; y < height; y++) {
                    const row: RGBColor[] = [];
                    for (let x = 0; x < width; x++) {
                        const idx = (y * width + x) * 3;
                        const r = rawPixels[idx];
                        const g = rawPixels[idx + 1];
                        const b = rawPixels[idx + 2];
                        row.push(new RGBColor(r, g, b));
                    }
                    rgbArray.push(row);
                }

                // Do something with the 2D RGB array
                console.log(`Processed frame ${frame}`);
                frames.push(rgbArray);

                // Copy the overflowing part of the chunk to the beginning of the buffer
                buffer.copy(buffer, 0, frameSize, bufPos);
                bufPos = bufPos - frameSize;

                frame++;
            }

            // Stop processing if endFrame is reached or if 5 frames are processed
            if (endFrame !== undefined && frame >= endFrame - startFrame) {
                ffmpeg.kill('SIGINT'); // Send SIGINT signal to ffmpeg to terminate it gracefully
            }
        });

        ffmpeg.on('close', () => {
            resolve(frames);
        });

        ffmpeg.on('error', (err) => {
            reject(err);
        });
    });
}
