import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NesBoardComponent } from './nes-board.component';

describe('NesBoardComponent', () => {
  let component: NesBoardComponent;
  let fixture: ComponentFixture<NesBoardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NesBoardComponent]
    });
    fixture = TestBed.createComponent(NesBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
