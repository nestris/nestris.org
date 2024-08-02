import { RGBColor } from '../shared/tetris/tetromino-colors';

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
 * Parses a video file and returns an array of 2D RGB arrays, where each 2D array represents a frame.
 * @param videoPath Path to the video file
 * @param startFrame Specifies the first frame to process, inclusive. Default is 0.
 * @param endFrame Specifies the last frame to process, inclusive. If not provided, all frames after startFrame will be processed.
 * @returns A promise that resolves with the array of 2D RGB arrays
 */
export async function parseVideo(testcase: string, startFrame: number = 0, endFrame?: number): Promise<RGBColor[][][]> {

    /*
    Use API for video frame processing at localhost:5000.

    1. /info [GET]: 
    - Retrieves video details (number of frames, width, height) and the current testcase.

    2. /frame/<int:frame> [GET]:
    - Fetches the RGB pixel data of the specified frame number as a 2D array.

    3. /set/<string:testcase> [POST]:
    - Sets the video to use a specific testcase and initializes video properties.
    */

    // Set the video to use the specified testcase
    await fetchAPI('POST', `set/${testcase}`);

    // Fetch video details
    const info = await fetchAPI('GET', 'info');
    console.log(info);
    const { testcase: fetchedTestcase, frames: numFrames, width, height } = info;
    if (fetchedTestcase !== testcase) throw new Error(`Failed to set testcase to ${testcase}, got ${fetchedTestcase}`);
    if (startFrame < 0 || startFrame >= numFrames) throw new Error(`Invalid start frame ${startFrame}, video has ${numFrames} frames`);
    if (endFrame && (endFrame < 0 || endFrame >= numFrames)) throw new Error(`Invalid end frame ${endFrame}, video has ${numFrames} frames`);
    
    // Process frames
    const frames: RGBColor[][][] = [];
    for (let i = startFrame; i <= (endFrame ?? numFrames-1); i++) {

        // Fetch frame data from API
        const { image } = await fetchAPI('GET', `frame/${i}`);

        // Image is a 2d list of [r,g,b]. Convert image data to 2D RGB array
        const frame: RGBColor[][] = [];
        for (let y = 0; y < height; y++) {
            const row: RGBColor[] = [];
            for (let x = 0; x < width; x++) {
                const [r, g, b] = image[y][x];
                row.push(new RGBColor(r, g, b));
            }
            frame.push(row);
        }
        frames.push(frame);
    }

    return frames;
    
}

