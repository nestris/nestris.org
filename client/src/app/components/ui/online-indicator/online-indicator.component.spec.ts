import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlineIndicatorComponent } from './online-indicator.component';

describe('OnlineIndicatorComponent', () => {
  let component: OnlineIndicatorComponent;
  let fixture: ComponentFixture<OnlineIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OnlineIndicatorComponent]
    });
    fixture = TestBed.createComponent(OnlineIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
