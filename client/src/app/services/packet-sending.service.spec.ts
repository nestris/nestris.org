import { TestBed } from '@angular/core/testing';

import { PacketSendingService } from './packet-sending.service';

describe('PacketSendingService', () => {
  let service: PacketSendingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PacketSendingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
