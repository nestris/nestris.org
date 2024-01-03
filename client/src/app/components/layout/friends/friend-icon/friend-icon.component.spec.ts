import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendIconComponent } from './friend-icon.component';

describe('FriendIconComponent', () => {
  let component: FriendIconComponent;
  let fixture: ComponentFixture<FriendIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FriendIconComponent]
    });
    fixture = TestBed.createComponent(FriendIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
