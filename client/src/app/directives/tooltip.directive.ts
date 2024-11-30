import { Directive, ElementRef, HostListener, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { TooltipService } from '../services/tooltip.service';
import { Point } from '../shared/tetris/point';

@Directive({
  selector: '[tooltip]'
})
export class TooltipDirective implements OnChanges, OnDestroy {

  @Input('tooltip') tooltipText: string = '';
  @Input('tooltipPosition') tooltipPosition: Point | null = null;

  constructor(private el: ElementRef, private tooltipManager: TooltipService) {}

  ngOnChanges() {
    if (this.tooltipPosition !== null) {
      this.tooltipManager.show(this.tooltipText, this.tooltipPosition.x, this.tooltipPosition.y);
    }
  }

  @HostListener('mouseenter', ['$event']) onMouseEnter(event: MouseEvent) {

    if (this.tooltipPosition !== null) return;

    // If there is no tooltip text, don't show the tooltip
    if (!this.tooltipText || this.tooltipText === "") return;

    this.tooltipManager.show(this.tooltipText, event.clientX, event.clientY);
  }

  @HostListener('mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    if (this.tooltipPosition !== null) return;
    this.tooltipManager.setPosition(event.clientX, event.clientY);
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltipPosition !== null) return;
    this.tooltipManager.hide();
  }

  // This method gets called when the directive/component is destroyed
  ngOnDestroy() {
    this.tooltipManager.hide();
  }

}
