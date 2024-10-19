import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, Observable } from 'rxjs';
import { FetchService, Method } from './fetch.service';
import { NonNullableFormBuilder } from '@angular/forms';



export abstract class CacheableRequest<ResponseType> {
  private response$ = new BehaviorSubject<ResponseType | undefined>(undefined);

  constructor(protected fetchService: FetchService) {}

  public get$(): Observable<ResponseType> {
    return this.response$.asObservable().pipe(
      filter((response): response is ResponseType => response !== undefined)
    );
  }

  public async get(): Promise<ResponseType> {
    if (this.response$.value === undefined) {
      await this.refresh();
    }
    return firstValueFrom(this.get$());
  }

  public async refresh(): Promise<void> {
    const response = await this.fetch();
    this.response$.next(response);
  }

  protected abstract fetch(): Promise<ResponseType>;
}

export interface TestResponse {
  test: number;
}

export class TestRequest extends CacheableRequest<TestResponse> {
  constructor(
    fetchService: FetchService,
  ) {
    super(fetchService);
  }

  protected async fetch(): Promise<TestResponse> {
    // wait 2 seconds, then return a random number
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { test: Math.random() };
  }
}

/**
 * Example usage:
 * 
 * const test = await cacheableRequestService.get(TestRequest);
 * cacheableRequestService.refresh(TestRequest);
 */

@Injectable({
  providedIn: 'root'
})
export class CacheableRequestService {

  private cache = new Map<new (fetchService: FetchService) => CacheableRequest<any>, CacheableRequest<any>>();

  constructor(private readonly fetchService: FetchService) {}

  /**
   * Get a cacheable request of the given type. Returns cached request if it exists, otherwise creates a new one.
   * @param requestType A class that extends CacheableRequest
   * @returns A cacheable request of the given type
   */
  public async get<T>(requestType: new (fetchService: FetchService) => CacheableRequest<T>): Promise<T> {
    if (!this.cache.has(requestType)) {
      this.cache.set(requestType, new requestType(this.fetchService));
    }
    return await this.cache.get(requestType)!.get();
  }

  public get$<T>(requestType: new (fetchService: FetchService) => CacheableRequest<T>): Observable<T> {
    const request = this.cache.get(requestType);
    if (!request) {
      const newRequest = new requestType(this.fetchService);
      this.cache.set(requestType, newRequest);
      return newRequest.get$();
    }
    return request.get$();
  }

  public async refresh<T>(requestType: new (fetchService: FetchService) => CacheableRequest<T>): Promise<void> {
    const request = this.cache.get(requestType);
    if (!request) await this.get(requestType);
    else await request.refresh();
  }
}