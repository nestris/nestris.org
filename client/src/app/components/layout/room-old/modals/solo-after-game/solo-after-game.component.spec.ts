import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoloAfterGameComponent } from './solo-after-game.component';

describe('SoloAfterGameComponent', () => {
  let component: SoloAfterGameComponent;
  let fixture: ComponentFixture<SoloAfterGameComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SoloAfterGameComponent]
    });
    fixture = TestBed.createComponent(SoloAfterGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
