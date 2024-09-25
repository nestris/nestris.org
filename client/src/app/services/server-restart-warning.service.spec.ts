import { TestBed } from '@angular/core/testing';

import { ServerRestartWarningService } from './server-restart-warning.service';

describe('ServerRestartWarningService', () => {
  let service: ServerRestartWarningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerRestartWarningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
