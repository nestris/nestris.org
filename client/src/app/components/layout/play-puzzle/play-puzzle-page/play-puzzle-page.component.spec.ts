import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayPuzzlePageComponent } from './play-puzzle-page.component';

describe('PlayPuzzlePageComponent', () => {
  let component: PlayPuzzlePageComponent;
  let fixture: ComponentFixture<PlayPuzzlePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlayPuzzlePageComponent]
    });
    fixture = TestBed.createComponent(PlayPuzzlePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
