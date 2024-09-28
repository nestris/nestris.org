import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzleLeaderboardComponent } from './puzzle-leaderboard.component';

describe('PuzzleLeaderboardComponent', () => {
  let component: PuzzleLeaderboardComponent;
  let fixture: ComponentFixture<PuzzleLeaderboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PuzzleLeaderboardComponent]
    });
    fixture = TestBed.createComponent(PuzzleLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
