import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonCardComponent } from './lesson-card.component';

describe('LessonCardComponent', () => {
  let component: LessonCardComponent;
  let fixture: ComponentFixture<LessonCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LessonCardComponent]
    });
    fixture = TestBed.createComponent(LessonCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
