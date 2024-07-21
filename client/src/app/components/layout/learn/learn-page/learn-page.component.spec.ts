import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnPageComponent } from './learn-page.component';

describe('LearnPageComponent', () => {
  let component: LearnPageComponent;
  let fixture: ComponentFixture<LearnPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LearnPageComponent]
    });
    fixture = TestBed.createComponent(LearnPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
