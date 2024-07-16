import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzleDatabaseComponent } from './puzzle-database.component';

describe('PuzzleDatabaseComponent', () => {
  let component: PuzzleDatabaseComponent;
  let fixture: ComponentFixture<PuzzleDatabaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PuzzleDatabaseComponent]
    });
    fixture = TestBed.createComponent(PuzzleDatabaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
