import { Component } from '@angular/core';
import { BannerManagerService } from 'src/app/services/banner-manager.service';

@Component({
  selector: 'app-banners',
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss']
})
export class BannersComponent {

  constructor(
    public readonly bannerManager: BannerManagerService
  ) {}

}
