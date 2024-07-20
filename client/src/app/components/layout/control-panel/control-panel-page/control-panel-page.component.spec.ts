import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlPanelPageComponent } from './control-panel-page.component';

describe('ControlPanelPageComponent', () => {
  let component: ControlPanelPageComponent;
  let fixture: ComponentFixture<ControlPanelPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ControlPanelPageComponent]
    });
    fixture = TestBed.createComponent(ControlPanelPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
