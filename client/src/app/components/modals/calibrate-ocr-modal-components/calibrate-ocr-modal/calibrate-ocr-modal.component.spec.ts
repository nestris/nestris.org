import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalibrateOcrModalComponent } from './calibrate-ocr-modal.component';

describe('CalibrateOcrModalComponent', () => {
  let component: CalibrateOcrModalComponent;
  let fixture: ComponentFixture<CalibrateOcrModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalibrateOcrModalComponent]
    });
    fixture = TestBed.createComponent(CalibrateOcrModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
