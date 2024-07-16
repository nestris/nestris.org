import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NesPanelComponent } from './nes-panel.component';

describe('NesPanelComponent', () => {
  let component: NesPanelComponent;
  let fixture: ComponentFixture<NesPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NesPanelComponent]
    });
    fixture = TestBed.createComponent(NesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
