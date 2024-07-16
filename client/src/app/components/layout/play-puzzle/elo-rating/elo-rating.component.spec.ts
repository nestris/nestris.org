import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EloRatingComponent } from './elo-rating.component';

describe('EloRatingComponent', () => {
  let component: EloRatingComponent;
  let fixture: ComponentFixture<EloRatingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EloRatingComponent]
    });
    fixture = TestBed.createComponent(EloRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
