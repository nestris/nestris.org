import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiplayerInMatchComponent } from './multiplayer-in-match.component';

describe('MultiplayerInMatchComponent', () => {
  let component: MultiplayerInMatchComponent;
  let fixture: ComponentFixture<MultiplayerInMatchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultiplayerInMatchComponent]
    });
    fixture = TestBed.createComponent(MultiplayerInMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
