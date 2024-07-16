import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YourPuzzleItemComponent } from './your-puzzle-item.component';

describe('YourPuzzleItemComponent', () => {
  let component: YourPuzzleItemComponent;
  let fixture: ComponentFixture<YourPuzzleItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [YourPuzzleItemComponent]
    });
    fixture = TestBed.createComponent(YourPuzzleItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
