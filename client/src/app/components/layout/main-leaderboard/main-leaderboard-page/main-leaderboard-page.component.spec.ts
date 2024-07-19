import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainLeaderboardPageComponent } from './main-leaderboard-page.component';

describe('MainLeaderboardPageComponent', () => {
  let component: MainLeaderboardPageComponent;
  let fixture: ComponentFixture<MainLeaderboardPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainLeaderboardPageComponent]
    });
    fixture = TestBed.createComponent(MainLeaderboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
