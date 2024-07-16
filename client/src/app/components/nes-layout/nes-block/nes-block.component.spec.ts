import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NesBlockComponent } from './nes-block.component';

describe('NesBlockComponent', () => {
  let component: NesBlockComponent;
  let fixture: ComponentFixture<NesBlockComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NesBlockComponent]
    });
    fixture = TestBed.createComponent(NesBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
