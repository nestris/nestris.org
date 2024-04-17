import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackThumbsComponent } from './feedback-thumbs.component';

describe('FeedbackThumbsComponent', () => {
  let component: FeedbackThumbsComponent;
  let fixture: ComponentFixture<FeedbackThumbsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FeedbackThumbsComponent]
    });
    fixture = TestBed.createComponent(FeedbackThumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
