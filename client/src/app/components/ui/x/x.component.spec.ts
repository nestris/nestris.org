import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XComponent } from './x.component';

describe('XComponent', () => {
  let component: XComponent;
  let fixture: ComponentFixture<XComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [XComponent]
    });
    fixture = TestBed.createComponent(XComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
