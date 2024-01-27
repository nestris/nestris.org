import { TestBed } from '@angular/core/testing';

import { FetchPuzzleService } from './fetch-puzzle.service';

describe('FetchPuzzleService', () => {
  let service: FetchPuzzleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FetchPuzzleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
