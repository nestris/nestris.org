import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OldRoomPageComponent } from './room-page.component';

describe('SoloPageComponent', () => {
  let component: OldRoomPageComponent;
  let fixture: ComponentFixture<OldRoomPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OldRoomPageComponent]
    });
    fixture = TestBed.createComponent(OldRoomPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
