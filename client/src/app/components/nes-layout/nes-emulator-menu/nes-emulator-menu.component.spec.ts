import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NesEmulatorMenuComponent } from './nes-emulator-menu.component';

describe('NesEmulatorMenuComponent', () => {
  let component: NesEmulatorMenuComponent;
  let fixture: ComponentFixture<NesEmulatorMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NesEmulatorMenuComponent]
    });
    fixture = TestBed.createComponent(NesEmulatorMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
