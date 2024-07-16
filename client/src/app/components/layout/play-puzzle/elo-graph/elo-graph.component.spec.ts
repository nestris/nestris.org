import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EloGraphComponent } from './elo-graph.component';

describe('EloGraphComponent', () => {
  let component: EloGraphComponent;
  let fixture: ComponentFixture<EloGraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EloGraphComponent]
    });
    fixture = TestBed.createComponent(EloGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
