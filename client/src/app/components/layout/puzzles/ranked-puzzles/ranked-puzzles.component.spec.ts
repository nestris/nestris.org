import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankedPuzzlesComponent } from './ranked-puzzles.component';

describe('RankedPuzzlesComponent', () => {
  let component: RankedPuzzlesComponent;
  let fixture: ComponentFixture<RankedPuzzlesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RankedPuzzlesComponent]
    });
    fixture = TestBed.createComponent(RankedPuzzlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
