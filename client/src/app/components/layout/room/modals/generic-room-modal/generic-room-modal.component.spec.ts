import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericRoomModalComponent } from './generic-room-modal.component';

describe('GenericRoomModalComponent', () => {
  let component: GenericRoomModalComponent;
  let fixture: ComponentFixture<GenericRoomModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GenericRoomModalComponent]
    });
    fixture = TestBed.createComponent(GenericRoomModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
