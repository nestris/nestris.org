import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomPageComponent } from './room-page.component';

describe('SoloPageComponent', () => {
  let component: RoomPageComponent;
  let fixture: ComponentFixture<RoomPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RoomPageComponent]
    });
    fixture = TestBed.createComponent(RoomPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
