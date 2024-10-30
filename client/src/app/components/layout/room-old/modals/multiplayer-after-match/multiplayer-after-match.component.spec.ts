import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiplayerAfterMatchComponent } from './multiplayer-after-match.component';

describe('MultiplayerAfterMatchComponent', () => {
  let component: MultiplayerAfterMatchComponent;
  let fixture: ComponentFixture<MultiplayerAfterMatchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultiplayerAfterMatchComponent]
    });
    fixture = TestBed.createComponent(MultiplayerAfterMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
