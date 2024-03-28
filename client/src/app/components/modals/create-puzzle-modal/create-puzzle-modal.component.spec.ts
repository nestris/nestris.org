import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePuzzleModalComponent } from './create-puzzle-modal.component';

describe('CreatePuzzleModalComponent', () => {
  let component: CreatePuzzleModalComponent;
  let fixture: ComponentFixture<CreatePuzzleModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreatePuzzleModalComponent]
    });
    fixture = TestBed.createComponent(CreatePuzzleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
