import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { NotifierModule, NotifierOptions } from 'angular-notifier';
import { HomePageComponent } from './components/layout/home/home-page/home-page.component';
import { SidebarComponent } from './components/layout/root/sidebar/sidebar.component';
import { PlayPageComponent } from './components/layout/play/play-page/play-page.component';
import { SidebarTabComponent } from './components/layout/root/sidebar-tab/sidebar-tab.component';
import { LayoutComponent } from './components/layout/root/layout/layout.component';
import { SignOutComponent } from './components/layout/root/sign-out/sign-out.component';

const customNotifierOptions: NotifierOptions = {
  position: {
    horizontal: {
      position: 'right',
      distance: 12,
    },
    vertical: {
      position: 'bottom',
      distance: 12,
      gap: 10,
    },
  },
  theme: 'material',
  behaviour: {
    autoHide: 5000,
    onClick: false,
    onMouseover: 'pauseAutoHide',
    showDismissButton: true,
    stacking: 4,
  },
  animations: {
    enabled: true,
    show: {
      preset: 'slide',
      speed: 300,
      easing: 'ease',
    },
    hide: {
      preset: 'fade',
      speed: 300,
      easing: 'ease',
      offset: 50,
    },
    shift: {
      speed: 300,
      easing: 'ease',
    },
    overlap: 150,
  },
};

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    SidebarComponent,
    SidebarTabComponent,
    HomePageComponent,
    PlayPageComponent,
    SignOutComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NotifierModule.withConfig(customNotifierOptions),
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}