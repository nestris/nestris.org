import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzleNesBoardComponent } from './puzzle-nes-board.component';

describe('PuzzleNesBoardComponent', () => {
  let component: PuzzleNesBoardComponent;
  let fixture: ComponentFixture<PuzzleNesBoardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PuzzleNesBoardComponent]
    });
    fixture = TestBed.createComponent(PuzzleNesBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
