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
import { ProfileTabComponent } from './components/layout/root/profile-tab/profile-tab.component';
import { PingIconComponent } from './components/layout/root/ping-icon/ping-icon.component';
import { GoogleSigninComponent } from './components/ui/google-signin/google-signin.component';
import { SolidButtonComponent } from './components/ui/solid-button/solid-button.component';
import { FriendPageComponent } from './components/layout/friends/friend-page/friend-page.component';
import { ModalComponent } from './components/ui/modal/modal.component';
import { XComponent } from './components/ui/x/x.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { AddFriendModalComponent } from './components/layout/friends/add-friend-modal/add-friend-modal.component';
import { FriendIconComponent } from './components/layout/friends/friend-icon/friend-icon.component';
import { FriendElementComponent } from './components/layout/friends/friend-element/friend-element.component';
import { OnlineIndicatorComponent } from './components/ui/online-indicator/online-indicator.component';
import { NesPanelComponent } from './components/nes-layout/nes-panel/nes-panel.component';
import { NesBoardComponent } from './components/nes-layout/nes-board/nes-board.component';
import { NesBlockComponent } from './components/nes-layout/nes-block/nes-block.component';
import { PuzzlesPageComponent } from './components/layout/puzzles/puzzles-page/puzzles-page.component';
import { SoloPageComponent } from './components/layout/solo/solo-page/solo-page.component';
import { MultiplayerPageComponent } from './components/layout/multiplayer/multiplayer-page/multiplayer-page.component';
import { OutlineButtonComponent } from './components/ui/outline-button/outline-button.component';
import { LayoutOneComponent } from './components/nes-layout/layouts/layout-one/layout-one.component';
import { NesPieceComponent } from './components/nes-layout/nes-piece/nes-piece.component';

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
    autoHide: false,
    onClick: 'hide',
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
    ProfileTabComponent,
    PingIconComponent,
    GoogleSigninComponent,
    SolidButtonComponent,
    FriendPageComponent,
    ModalComponent,
    XComponent,
    AddFriendModalComponent,
    ClickOutsideDirective,
    FriendIconComponent,
    FriendElementComponent,
    OnlineIndicatorComponent,
    NesPanelComponent,
    NesBoardComponent,
    NesBlockComponent,
    PuzzlesPageComponent,
    SoloPageComponent,
    MultiplayerPageComponent,
    OutlineButtonComponent,
    LayoutOneComponent,
    NesPieceComponent
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