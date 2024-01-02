import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PingIconComponent } from './ping-icon.component';

describe('PingIconComponent', () => {
  let component: PingIconComponent;
  let fixture: ComponentFixture<PingIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PingIconComponent]
    });
    fixture = TestBed.createComponent(PingIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
