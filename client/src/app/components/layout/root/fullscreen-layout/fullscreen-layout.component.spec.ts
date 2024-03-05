import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullscreenLayoutComponent } from './fullscreen-layout.component';

describe('FullscreenLayoutComponent', () => {
  let component: FullscreenLayoutComponent;
  let fixture: ComponentFixture<FullscreenLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FullscreenLayoutComponent]
    });
    fixture = TestBed.createComponent(FullscreenLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
