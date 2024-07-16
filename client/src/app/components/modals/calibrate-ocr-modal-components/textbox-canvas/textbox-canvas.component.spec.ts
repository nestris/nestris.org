import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextboxCanvasComponent } from './textbox-canvas.component';

describe('TextboxCanvasComponent', () => {
  let component: TextboxCanvasComponent;
  let fixture: ComponentFixture<TextboxCanvasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextboxCanvasComponent]
    });
    fixture = TestBed.createComponent(TextboxCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
