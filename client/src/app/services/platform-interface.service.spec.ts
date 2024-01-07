import { TestBed } from '@angular/core/testing';

import { PlatformInterfaceService } from './platform-interface.service';

describe('PlatformInterfaceService', () => {
  let service: PlatformInterfaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlatformInterfaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
