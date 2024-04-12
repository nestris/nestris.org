import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MorePageComponent } from './more-page.component';

describe('MorePageComponent', () => {
  let component: MorePageComponent;
  let fixture: ComponentFixture<MorePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MorePageComponent]
    });
    fixture = TestBed.createComponent(MorePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
