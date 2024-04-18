import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyStreakComponent } from './daily-streak.component';

describe('DailyStreakComponent', () => {
  let component: DailyStreakComponent;
  let fixture: ComponentFixture<DailyStreakComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DailyStreakComponent]
    });
    fixture = TestBed.createComponent(DailyStreakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
