import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layout/root/main-layout/main-layout.component';
import { AuthGuard } from './auth-guard';
import { HomePageComponent } from './components/layout/home/home-page/home-page.component';
import { PlayPageComponent } from './components/layout/play/play-page/play-page.component';
import { FullscreenLayoutComponent } from './components/layout/root/fullscreen-layout/fullscreen-layout.component';
import { RoomPageComponent } from './components/layout/room/room-page/room-page.component';
import { PuzzlesPageComponent } from './components/layout/puzzles/puzzles-page/puzzles-page.component';
import { PlayPuzzlePageComponent } from './components/layout/play-puzzle/play-puzzle-page/play-puzzle-page.component';
import { ProfileTabComponent } from './components/layout/root/profile-tab/profile-tab.component';
import { ProfilePageComponent } from './components/layout/profile/profile-page/profile-page.component';
import { FriendPageComponent } from './components/layout/friends/friend-page/friend-page.component';
import { ReviewPageComponent } from './components/layout/review/review-page/review-page.component';
import { RankedPuzzlesComponent } from './components/layout/puzzles/ranked-puzzles/ranked-puzzles.component';
import { YourPuzzlesComponent } from './components/layout/puzzles/your-puzzles/your-puzzles.component';
import { PuzzleDatabaseComponent } from './components/layout/puzzles/puzzle-database/puzzle-database.component';
import { MorePageComponent } from './components/layout/more/more-page/more-page.component';

const routes: Routes = [
  {
    path: 'online',
    component: FullscreenLayoutComponent,
    children: [
      { path: "room", component: RoomPageComponent, },
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
      { path: "puzzles", component: PuzzlesPageComponent,
        children: [
          { path: "ranked", component: RankedPuzzlesComponent },
          { path: "view", component: YourPuzzlesComponent },
          { path: "database", component: PuzzleDatabaseComponent },
          { path: "", redirectTo: "ranked", pathMatch: "full", },
          { path: "**", redirectTo: "ranked", pathMatch: "full", }
        ]
      },
      { path: "more", component: MorePageComponent },
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
