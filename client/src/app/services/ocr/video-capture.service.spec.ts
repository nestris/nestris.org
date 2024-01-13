import { TestBed } from '@angular/core/testing';

import { VideoCaptureService } from './video-capture.service';

describe('VideoCaptureService', () => {
  let service: VideoCaptureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoCaptureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
