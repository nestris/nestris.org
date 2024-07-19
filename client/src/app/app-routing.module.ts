import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layout/root/main-layout/main-layout.component';
import { PlayPageComponent } from './components/layout/play/play-page/play-page.component';
import { FullscreenLayoutComponent } from './components/layout/root/fullscreen-layout/fullscreen-layout.component';
import { RoomPageComponent } from './components/layout/room/room-page/room-page.component';
import { PlayPuzzlePageComponent } from './components/layout/play-puzzle/play-puzzle-page/play-puzzle-page.component';
import { ProfilePageComponent } from './components/layout/profile/profile-page/profile-page.component';
import { FriendPageComponent } from './components/layout/friends/friend-page/friend-page.component';
import { ReviewPageComponent } from './components/layout/review/review-page/review-page.component';
import { LearnPageComponent } from './components/layout/learn/learn-page/learn-page.component';
import { DashboardComponent } from './components/layout/learn/dashboard/dashboard.component';
import { LessonComponent } from './components/layout/learn/lesson/lesson.component';
import { LoginPageComponent } from './components/layout/login/login-page/login-page.component';
import { PuzzlesPageComponent } from './components/layout/puzzles/puzzles-page.component';
import { LeaderboardComponent } from './components/layout/play-puzzle/leaderboard/leaderboard.component';
import { MainLeaderboardPageComponent } from './components/layout/main-leaderboard/main-leaderboard-page/main-leaderboard-page.component';
import { WelcomePageComponent } from './components/layout/welcome/welcome-page/welcome-page.component';

const routes: Routes = [

  { path: "login", component: LoginPageComponent },

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
      { path: "play", component: PlayPageComponent, },
      { path: "review", component: ReviewPageComponent },

      { path: "learn", component: LearnPageComponent,
        children: [
          { path: "dashboard", component: DashboardComponent },
          { path: "lesson", component: LessonComponent },
          { path: "", redirectTo: "dashboard", pathMatch: "full", },
          { path: "**", redirectTo: "dashboard", pathMatch: "full", }
        ]
       },

      { path: "puzzles", component: PuzzlesPageComponent },
      { path: "leaderboard", component: MainLeaderboardPageComponent },

       { path: "welcome", component: WelcomePageComponent },

      { path: "", redirectTo: "play", pathMatch: "full", },
      { path: "**", redirectTo: "play", pathMatch: "full", }
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
