import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardEditorComponent } from './board-editor.component';

describe('BoardEditorComponent', () => {
  let component: BoardEditorComponent;
  let fixture: ComponentFixture<BoardEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BoardEditorComponent]
    });
    fixture = TestBed.createComponent(BoardEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
