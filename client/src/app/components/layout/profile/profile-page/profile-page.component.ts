import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent implements OnInit {

  constructor() { }

  async ngOnInit() {

    const response = await fetchServer2<{count: number}>(Method.GET, `/api/v2/profile`);
    console.log(response);
  }

}
