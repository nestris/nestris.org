import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FetchService, Method } from 'src/app/services/fetch.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent implements OnInit {

  constructor(
    private fetchService: FetchService,
  ) { }

  async ngOnInit() {

    const response = await this.fetchService.fetch<{count: number}>(Method.GET, `/api/v2/me`);
    console.log(response);
  }

}
