import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullscreenExitButtonComponent } from './fullscreen-exit-button.component';

describe('FullscreenExitButtonComponent', () => {
  let component: FullscreenExitButtonComponent;
  let fixture: ComponentFixture<FullscreenExitButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FullscreenExitButtonComponent]
    });
    fixture = TestBed.createComponent(FullscreenExitButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
