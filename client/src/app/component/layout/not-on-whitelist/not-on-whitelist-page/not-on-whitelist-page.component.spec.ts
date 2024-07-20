import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotOnWhitelistPageComponent } from './not-on-whitelist-page.component';

describe('NotOnWhitelistPageComponent', () => {
  let component: NotOnWhitelistPageComponent;
  let fixture: ComponentFixture<NotOnWhitelistPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NotOnWhitelistPageComponent]
    });
    fixture = TestBed.createComponent(NotOnWhitelistPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
