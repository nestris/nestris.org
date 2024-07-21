import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalRankComponent } from './global-rank.component';

describe('GlobalRankComponent', () => {
  let component: GlobalRankComponent;
  let fixture: ComponentFixture<GlobalRankComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GlobalRankComponent]
    });
    fixture = TestBed.createComponent(GlobalRankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
