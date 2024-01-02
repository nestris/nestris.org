import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileTabComponent } from './profile-tab.component';

describe('ProfileTabComponent', () => {
  let component: ProfileTabComponent;
  let fixture: ComponentFixture<ProfileTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileTabComponent]
    });
    fixture = TestBed.createComponent(ProfileTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
