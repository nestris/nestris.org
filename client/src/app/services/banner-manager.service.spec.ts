import { TestBed } from '@angular/core/testing';

import { BannerManagerService } from './banner-manager.service';

describe('BannerManagerService', () => {
  let service: BannerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BannerManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
