import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzlesPageComponent } from './puzzles-page.component';

describe('PuzzlesPageComponent', () => {
  let component: PuzzlesPageComponent;
  let fixture: ComponentFixture<PuzzlesPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PuzzlesPageComponent]
    });
    fixture = TestBed.createComponent(PuzzlesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
