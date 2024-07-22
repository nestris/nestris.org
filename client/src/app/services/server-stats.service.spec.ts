import { TestBed } from '@angular/core/testing';

import { ServerStatsService } from './server-stats.service';

describe('ServerStatsService', () => {
  let service: ServerStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerStatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
