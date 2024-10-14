import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchmakingLoadingPageComponent } from './matchmaking-loading-page.component';

describe('MatchmakingLoadingPageComponent', () => {
  let component: MatchmakingLoadingPageComponent;
  let fixture: ComponentFixture<MatchmakingLoadingPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MatchmakingLoadingPageComponent]
    });
    fixture = TestBed.createComponent(MatchmakingLoadingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
