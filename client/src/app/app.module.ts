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
import { VideoCaptureComponent } from './components/ocr/video-capture/video-capture.component';
import { ModalContainerComponent } from './components/ui/modal-container/modal-container.component';
import { CalibrateOcrModalComponent } from './components/modals/calibrate-ocr-modal-components/calibrate-ocr-modal/calibrate-ocr-modal.component';
import { StepperComponent } from './components/ui/stepper/stepper.component';
import { TooltipDirective } from './directives/tooltip.directive';
import { TooltipComponent } from './components/ui/tooltip/tooltip.component';
import { PreviewCanvasComponent } from './components/modals/calibrate-ocr-modal-components/preview-canvas/preview-canvas.component';
import { PlayPuzzlePageComponent } from './components/layout/play-puzzle/play-puzzle-page/play-puzzle-page.component';
import { TimerComponent } from './components/layout/play-puzzle/timer/timer.component';
import { PuzzleNesBoardComponent } from './components/layout/play-puzzle/puzzle-nes-board/puzzle-nes-board.component';
import { EloRatingComponent } from './components/layout/play-puzzle/elo-rating/elo-rating.component';
import { LeaderboardComponent } from './components/layout/play-puzzle/leaderboard/leaderboard.component';
import { LoadingAnimationComponent } from './components/ui/loading-animation/loading-animation.component';
import { EloGraphComponent } from './components/layout/play-puzzle/elo-graph/elo-graph.component';
import { AppRoutingModule } from './app-routing.module';
import { FullscreenLayoutComponent } from './components/layout/root/fullscreen-layout/fullscreen-layout.component';
import { MainLayoutComponent } from './components/layout/root/main-layout/main-layout.component';
import { RouterModule } from '@angular/router';
import { ProfilePageComponent } from './components/layout/profile/profile-page/profile-page.component';
import { ReviewPageComponent } from './components/layout/review/review-page/review-page.component';
import { TabSelectorComponent } from './components/ui/tab-selector/tab-selector.component';
import { RankedPuzzlesComponent } from './components/layout/puzzles/ranked-puzzles/ranked-puzzles.component';
import { YourPuzzlesComponent } from './components/layout/puzzles/your-puzzles/your-puzzles.component';
import { AttemptHistoryComponent } from './components/layout/puzzles/attempt-history/attempt-history.component';
import { CreatePuzzleModalComponent } from './components/modals/create-puzzle-modal/create-puzzle-modal.component';

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
    NesPieceComponent,
    VideoCaptureComponent,
    ModalContainerComponent,
    CalibrateOcrModalComponent,
    StepperComponent,
    TooltipDirective,
    TooltipComponent,
    PreviewCanvasComponent,
    PlayPuzzlePageComponent,
    TimerComponent,
    PuzzleNesBoardComponent,
    EloRatingComponent,
    LeaderboardComponent,
    LoadingAnimationComponent,
    EloGraphComponent,
    FullscreenLayoutComponent,
    MainLayoutComponent,
    ProfilePageComponent,
    ReviewPageComponent,
    TabSelectorComponent,
    RankedPuzzlesComponent,
    YourPuzzlesComponent,
    AttemptHistoryComponent,
    CreatePuzzleModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NotifierModule.withConfig(customNotifierOptions),
    HttpClientModule,
    RouterModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}