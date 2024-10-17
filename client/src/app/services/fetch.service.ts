import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';

export enum Method {
  POST = 'POST',
  GET = 'GET',
  DELETE = 'DELETE',
  PUT = 'PUT',
}

@Injectable({
  providedIn: 'root'
})
export class FetchService {

  constructor(
    private websocket: WebsocketService
  ) { }


  private getBaseURL(): string {
    return window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
  }

  // fetches from server and returns the response with generic-defined type
  // if websocket is provided and reponse is 401, tell the websocket to logout
  public async fetch<ResponseType>(
    method: Method,
    urlStr: string,
    content: any = undefined,
  ): Promise<ResponseType> {

    let url = new URL(urlStr, this.getBaseURL());
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
    if (response.status === 401) {
      console.log(`Logging out due to 401 response from ${urlStr}`);
      await this.websocket.logout();
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result as ResponseType;
  }

}
