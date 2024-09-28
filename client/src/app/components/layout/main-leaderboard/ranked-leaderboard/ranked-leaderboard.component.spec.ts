import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankedLeaderboardComponent } from './ranked-leaderboard.component';

describe('RankedLeaderboardComponent', () => {
  let component: RankedLeaderboardComponent;
  let fixture: ComponentFixture<RankedLeaderboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RankedLeaderboardComponent]
    });
    fixture = TestBed.createComponent(RankedLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
