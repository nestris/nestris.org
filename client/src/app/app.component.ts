import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private http: HttpClient) {  }
  nameInput: string = '';
  responseDisplay: string = '';
  greetMe(): void {
    this.http.get(`/api/${ this.nameInput }`)
      .subscribe((response: any) => this.responseDisplay = response.greeting);
  }
}