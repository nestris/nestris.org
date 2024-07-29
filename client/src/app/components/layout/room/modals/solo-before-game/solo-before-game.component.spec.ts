import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoloBeforeGameComponent } from './solo-before-game.component';

describe('SoloBeforeFirstGameComponent', () => {
  let component: SoloBeforeGameComponent;
  let fixture: ComponentFixture<SoloBeforeGameComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SoloBeforeGameComponent]
    });
    fixture = TestBed.createComponent(SoloBeforeGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
