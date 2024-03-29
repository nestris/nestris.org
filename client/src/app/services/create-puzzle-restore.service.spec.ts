import { TestBed } from '@angular/core/testing';

import { CreatePuzzleRestoreService } from './create-puzzle-restore.service';

describe('CreatePuzzleRestoreService', () => {
  let service: CreatePuzzleRestoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreatePuzzleRestoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
