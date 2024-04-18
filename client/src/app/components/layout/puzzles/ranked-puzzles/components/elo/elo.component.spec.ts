import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EloComponent } from './elo.component';

describe('EloComponent', () => {
  let component: EloComponent;
  let fixture: ComponentFixture<EloComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EloComponent]
    });
    fixture = TestBed.createComponent(EloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
