import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoloPageComponent } from './solo-page.component';

describe('SoloPageComponent', () => {
  let component: SoloPageComponent;
  let fixture: ComponentFixture<SoloPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SoloPageComponent]
    });
    fixture = TestBed.createComponent(SoloPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
