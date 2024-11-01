import { Component, ElementRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const MAX_CHARACTERS = 100;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {

  public message: string = "";
  public rows$ = new BehaviorSubject<number>(1);

  constructor(
    private elementRef: ElementRef
  ) {}

  public onChange(event: any) {

    console.log('Event:', event);

    let decreased = false;

    try {

      if (event.inputType === 'insertLineBreak') {
        this.submitMessage(this.message);
        return;
      }

      // If exceeds max chars, set to previous value
      if (event.target.value.length > MAX_CHARACTERS) {
        const textarea = this.elementRef.nativeElement.querySelector('textarea');
        textarea.value = this.message;
        return;
      }

      if (this.message.length > event.target.value.length) {
        decreased = true;
      }
      this.message = event.target.value;
    } catch {
      return;
    }

    if (decreased) {
      this.rows$.next(1);

      setTimeout(() => {
        this.updateRowCount();
      }, 0);

    }
    else this.updateRowCount();
    console.log('Message:', this.message);
    console.log('Rows:', this.rows$.value);
  }

  private updateRowCount() {
    const textarea = this.elementRef.nativeElement.querySelector('textarea');
    const scrollHeight = textarea.scrollHeight;
    const rowCount = Math.round(scrollHeight / 14);
    this.rows$.next(rowCount);
  }

  private submitMessage(message: string) {
    console.log('Submitting message:', message);

    // Reset the message
    const textarea = this.elementRef.nativeElement.querySelector('textarea');
    textarea.value = "";
    this.rows$.next(1);
    this.message = "";
  }

}
