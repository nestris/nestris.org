import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderboardTableComponent } from './leaderboard-table.component';

describe('TableComponent', () => {
  let component: LeaderboardTableComponent;
  let fixture: ComponentFixture<LeaderboardTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LeaderboardTableComponent]
    });
    fixture = TestBed.createComponent(LeaderboardTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
