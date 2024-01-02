import { TestBed } from '@angular/core/testing';

import { ServerAnnouncementService } from './server-announcement.service';

describe('ServerAnnouncementService', () => {
  let service: ServerAnnouncementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerAnnouncementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
