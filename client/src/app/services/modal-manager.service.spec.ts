import { TestBed } from '@angular/core/testing';

import { ModalManagerService } from './modal-manager.service';

describe('ModalManagerService', () => {
  let service: ModalManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
