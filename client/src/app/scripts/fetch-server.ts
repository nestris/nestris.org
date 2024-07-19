import { WebsocketService } from "../services/websocket.service";

export function getBaseURL(): string {
    return window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

}

export enum Method {
    POST = 'POST',
    GET = 'GET',
    DELETE = 'DELETE',
    PUT = 'PUT',
}

// fetches from server and returns the response with generic-defined type
// if websocket is provided and reponse is 401, tell the websocket to logout
export async function fetchServer2<ResponseType>(
    method: Method,
    urlStr: string,
    content: any = undefined,
    websocket: WebsocketService | undefined = undefined
): Promise<ResponseType> {

    let url = new URL(urlStr, getBaseURL());
    let json: string | undefined = undefined;

    if (content) {
        if (method === Method.POST) {
            json = JSON.stringify(content);
        } else {
            for (const [key, value] of Object.entries(content)) {
                // console.log(key, value);
                url.searchParams.append(key, value as string);
            }
        }
    }
    
    const response = await fetch( url.toString(), {
        method: method.toString(),
        headers: {'Content-Type': 'application/json'},
        body: json
    });

    // if the response is 401, tell the websocket to logout
    if (response.status === 401 && websocket) {
        websocket.logout();
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result as ResponseType;
}