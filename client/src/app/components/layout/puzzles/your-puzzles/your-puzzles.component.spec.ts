import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YourPuzzlesComponent } from './your-puzzles.component';

describe('YourPuzzlesComponent', () => {
  let component: YourPuzzlesComponent;
  let fixture: ComponentFixture<YourPuzzlesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [YourPuzzlesComponent]
    });
    fixture = TestBed.createComponent(YourPuzzlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
