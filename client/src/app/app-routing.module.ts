import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layout/root/main-layout/main-layout.component';
import { AuthGuard } from './auth-guard';
import { HomePageComponent } from './components/layout/home/home-page/home-page.component';
import { PlayPageComponent } from './components/layout/play/play-page/play-page.component';
import { FullscreenLayoutComponent } from './components/layout/root/fullscreen-layout/fullscreen-layout.component';
import { SoloPageComponent } from './components/layout/solo/solo-page/solo-page.component';
import { MultiplayerPageComponent } from './components/layout/multiplayer/multiplayer-page/multiplayer-page.component';
import { PuzzlesPageComponent } from './components/layout/puzzles/puzzles-page/puzzles-page.component';
import { PlayPuzzlePageComponent } from './components/layout/play-puzzle/play-puzzle-page/play-puzzle-page.component';
import { ProfileTabComponent } from './components/layout/root/profile-tab/profile-tab.component';
import { ProfilePageComponent } from './components/layout/profile/profile-page/profile-page.component';
import { FriendPageComponent } from './components/layout/friends/friend-page/friend-page.component';
import { ReviewPageComponent } from './components/layout/review/review-page/review-page.component';

const routes: Routes = [
  {
    path: 'online',
    component: FullscreenLayoutComponent,
    children: [
      { path: "solo", component: SoloPageComponent, },
      { path: "multiplayer", component: MultiplayerPageComponent, },
      { path: "puzzle", component: PlayPuzzlePageComponent, },
      { path: "", redirectTo: "home", pathMatch: "full", },
      { path: "**", redirectTo: "home", pathMatch: "full", }
    ],
    // canActivate: [AuthGuard],
    // canActivateChild: [AuthGuard]
  },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: "profile", component: ProfilePageComponent },
      { path: "friends", component: FriendPageComponent },
      { path: "home", component: HomePageComponent, },
      { path: "play", component: PlayPageComponent, },
      { path: "review", component: ReviewPageComponent },
      { path: "puzzles", component: PuzzlesPageComponent, },
      { path: "", redirectTo: "home", pathMatch: "full", },
      { path: "**", redirectTo: "home", pathMatch: "full", }
    ],
    // canActivate: [AuthGuard],
    // canActivateChild: [AuthGuard]
  },
  
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
