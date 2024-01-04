import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NesPieceComponent } from './nes-piece.component';

describe('NesPieceComponent', () => {
  let component: NesPieceComponent;
  let fixture: ComponentFixture<NesPieceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NesPieceComponent]
    });
    fixture = TestBed.createComponent(NesPieceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
