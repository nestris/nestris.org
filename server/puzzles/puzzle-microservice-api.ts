import axios from 'axios';

export async function makePostRequestToPuzzleMicroservice(endpoint: string, payload: any): Promise<any> {

    const puzzlesBaseURL = process.env['PUZZLES_URL'];

    if (puzzlesBaseURL == undefined) throw new Error("Internal Server Error: puzzles URL environment variable not set");

    const url = `${puzzlesBaseURL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };

    try {
        const response = await axios.post(url, payload, { headers });
        return response.data;
    } catch (error: any) {
       throw new Error(`Puzzles Microservice Error: ${error.message}`);
    }
}