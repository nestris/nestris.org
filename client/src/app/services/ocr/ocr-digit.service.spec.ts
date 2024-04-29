import { TestBed } from '@angular/core/testing';

import { OcrDigitService } from './ocr-digit.service';

describe('OcrDigitService', () => {
  let service: OcrDigitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OcrDigitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
