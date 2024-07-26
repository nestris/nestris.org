import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoloBeforeFirstGameComponent } from './solo-before-first-game.component';

describe('SoloBeforeFirstGameComponent', () => {
  let component: SoloBeforeFirstGameComponent;
  let fixture: ComponentFixture<SoloBeforeFirstGameComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SoloBeforeFirstGameComponent]
    });
    fixture = TestBed.createComponent(SoloBeforeFirstGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
