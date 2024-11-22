import { ChangeDetectionStrategy, Component } from '@angular/core';

/*
An abstract layout that defines the game state interface and leaves layout html and css up to implementation
To create your own layout, create a component that extends AbstractNesLayoutComponent
and build an HTML template using <app-nes-panel> and <app-nes-board> from @Inputs()
*/

@Component({
  selector: 'app-abstract-nes-layout',
  template: '',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class AbstractNesLayoutComponent {
  
}
