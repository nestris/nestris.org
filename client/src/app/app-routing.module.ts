import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layout/root/main-layout/main-layout.component';
import { PlayPageComponent } from './components/layout/play/play-page/play-page.component';
import { FullscreenLayoutComponent } from './components/layout/root/fullscreen-layout/fullscreen-layout.component';
import { PlayPuzzlePageComponent } from './components/layout/play-puzzle/play-puzzle-page/play-puzzle-page.component';
import { FriendPageComponent } from './components/layout/friends/friend-page/friend-page.component';
import { ReviewPageComponent } from './components/layout/review/review-page/review-page.component';
import { LearnPageComponent } from './components/layout/learn/learn-page/learn-page.component';
import { DashboardComponent } from './components/layout/learn/dashboard/dashboard.component';
import { LessonComponent } from './components/layout/learn/lesson/lesson.component';
import { LoginPageComponent } from './components/layout/login/login-page/login-page.component';
import { MainLeaderboardPageComponent } from './components/layout/main-leaderboard/main-leaderboard-page/main-leaderboard-page.component';
import { WelcomePageComponent } from './components/layout/welcome/welcome-page/welcome-page.component';
import { ControlPanelPageComponent } from './components/layout/control-panel/control-panel-page/control-panel-page.component';
import { SettingsPageComponent } from './components/layout/settings/settings-page/settings-page.component';
import { MatchmakingLoadingPageComponent } from './components/layout/multiplayer/matchmaking-loading-page/matchmaking-loading-page.component';
import { RoomComponent } from './components/layout/room/room/room.component';
import { GameAnalysisComponent } from './components/layout/game-analysis/game-analysis/game-analysis.component';

const routes: Routes = [

  { path: "login", component: LoginPageComponent },

  {
    path: 'online',
    component: FullscreenLayoutComponent,
    children: [
      { path: "room", component: RoomComponent },
      { path: "puzzle", component: PlayPuzzlePageComponent, },
      { path: "ranked", component: MatchmakingLoadingPageComponent },
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
            
      { path: "control-panel" , component: ControlPanelPageComponent },
      { path: "friends", component: FriendPageComponent },
      { path: "settings", component: SettingsPageComponent },
      { path: "play", component: PlayPageComponent, },
      { path: "review", component: ReviewPageComponent },

      { path: 'user/:userid', component: PlayPageComponent },
      { path: "game/:id", component: GameAnalysisComponent },

      { path: "learn", component: LearnPageComponent,
        children: [
          { path: "dashboard", component: DashboardComponent },
          { path: "lesson", component: LessonComponent },
          { path: "", redirectTo: "dashboard", pathMatch: "full", },
          { path: "**", redirectTo: "dashboard", pathMatch: "full", }
        ]
       },

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
