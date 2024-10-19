import { TestBed } from '@angular/core/testing';

import { CacheableRequestService } from './cacheable-request.service';

describe('CacheableRequestService', () => {
  let service: CacheableRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheableRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
