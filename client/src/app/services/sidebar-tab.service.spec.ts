import { TestBed } from '@angular/core/testing';

import { SidebarTabService } from './sidebar-tab.service';

describe('SidebarTabService', () => {
  let service: SidebarTabService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarTabService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
