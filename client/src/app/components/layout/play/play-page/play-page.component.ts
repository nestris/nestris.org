import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, map} from 'rxjs';
import { ProfileModalConfig } from 'src/app/components/modals/profile-modal/profile-modal.component';
import { Mode } from 'src/app/components/ui/mode-icon/mode-icon.component';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { NotificationService } from 'src/app/services/notification.service';
import { VideoCaptureService } from 'src/app/services/ocr/video-capture.service';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { PlayService } from 'src/app/services/play.service';
import { RankedQueueService } from 'src/app/services/room/ranked-queue.service';
import { ServerStatsService } from 'src/app/services/server-stats.service';
import { MeService } from 'src/app/services/state/me.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DBUser } from 'src/app/shared/models/db-user';
import { RelativeLeaderboards } from 'src/app/shared/models/leaderboard';
import { NotificationType } from 'src/app/shared/models/notifications';
import { Platform } from 'src/app/shared/models/platform';
import { DeploymentEnvironment } from 'src/app/shared/models/server-stats';
import { ALL_QUEST_IDS, getQuest, getQuestIdByCategoryAndDifficulty, getQuestStatus, QUEST_COLORS, QUEST_DIFFICULTY_ORDER, QuestID } from 'src/app/shared/nestris-org/quest-system';
import { capitalize, hexWithAlpha } from 'src/app/util/misc';

interface OngoingQuest {
  questID: QuestID,
  progress: number;
}

@Component({
  selector: 'app-play-page',
  templateUrl: './play-page.component.html',
  styleUrls: ['./play-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayPageComponent implements OnInit, OnDestroy {

  readonly ButtonColor = ButtonColor;
  readonly Platform = Platform;

  readonly Mode = Mode;
  readonly modes = Object.values(Mode);
  readonly hexWithAlpha = hexWithAlpha;
  readonly capitalize = capitalize;
  readonly QUEST_COLORS = QUEST_COLORS;

  public me$ = this.meService.get$();
  public leaderboards$ = new BehaviorSubject<RelativeLeaderboards>({
    solo: { playingNow: 0, leaderboard: [null, null, null] },
    ranked: { playingNow: 0, leaderboard: [null, null, null] },
    puzzles: { playingNow: 0, leaderboard: [null, null, null] }
  });
  private leaderboardInterval: any;

  public ongoingQuests$ = this.me$.pipe(
    map(me => this.getOngoingQuests(me))
  );

  constructor(
    public platformService: PlatformInterfaceService,
    public videoCapture: VideoCaptureService,
    private meService: MeService,
    private modalManager: ModalManagerService,
    private serverStats: ServerStatsService,
    private fetchService: FetchService,
    private notifier: NotificationService,
    private playService: PlayService,
    private route: ActivatedRoute,
  ) {

    const updateLeaderboards = async () => {
      const leaderboards = await this.fetchService.fetch<RelativeLeaderboards>(Method.GET, '/api/v2/leaderboard/relative');
      this.leaderboards$.next(leaderboards);
    }

    // Update leaderboards every 5 seconds
    this.leaderboardInterval = setInterval(updateLeaderboards, 5000);
    updateLeaderboards();
  }

  /**
   * We want urls like '/user/450748389001265186' to open up the profile modal. The routing module redirects /user
   * urls to this page, so that when profile closes, it should go back to regular play page
   */
  ngOnInit(): void {
    const userid = this.route.snapshot.paramMap.get('userid');
    if (userid && !this.modalManager.isModal()) {
      const config: ProfileModalConfig = { userid, originalUrl: "/play" };
      this.modalManager.showModal(ModalType.PROFILE, config);
    }
  }

  async setupCalibration(event: MouseEvent | undefined = undefined) {

    if (event) event.stopPropagation();

    // TEMPORARY: OCR platform is disabled for production
    const stats = await this.serverStats.waitForServerStats();
      if (stats.environment === DeploymentEnvironment.PRODUCTION) {
      this.notifier.notify(NotificationType.ERROR, "OCR platform is still under development. Please use emulator platform for now.");
      return;
    }

    this.modalManager.showModal(ModalType.CALIBRATE_OCR);
  }

  async onClickOCRPlatform() {

     // TEMPORARY: OCR platform is disabled for production
     const stats = await this.serverStats.waitForServerStats();
     if (stats.environment === DeploymentEnvironment.PRODUCTION) {
     this.notifier.notify(NotificationType.ERROR, "OCR platform is still under development. Please use emulator platform for now.");
     return;
   }

    // if calibration is valid, switch to OCR platform
    if (this.videoCapture.getCalibrationValid()) {
      this.platformService.setPlatform(Platform.OCR);
    } else { // Otherwise, first calibrate
      this.setupCalibration();
    }
  }


  onClickMode(mode: Mode) {
    switch (mode) {
      case Mode.SOLO: return this.playService.playSolo();
      case Mode.RANKED: return this.playService.playRanked();
      case Mode.PUZZLES: return this.playService.playPuzzles();
    }
  }


  comingSoon() {
    this.notifier.notify(NotificationType.ERROR, "This feature is currently in development. Coming soon!");
  }

  ngOnDestroy() {
    clearInterval(this.leaderboardInterval);
  }

  isMe(userid: string) {
    return this.meService.getUserIDSync() === userid;
  }

  showMyQuests() {
    this.modalManager.showModal(ModalType.QUEST_LIST);
  }

  private getOngoingQuests(me: DBUser): OngoingQuest[] {

    // Find the two ongoing quests closest to complete
    const questIDs = ALL_QUEST_IDS.filter(questID => {
      const quest = getQuest(questID);
      const questStatus = getQuestStatus(me.quest_progress, questID);

      if (questStatus.completed) return false; // Completed quests are not ongoing 

      // Edge case: if automaton isn't at 93+, do not display
      if (questID === QuestID.AUTOMATON && questStatus.currentScore < 93) return false;

      const isTooAdvanced = () => {
        if (!quest.category) return false;
        const difficultyIndex = QUEST_DIFFICULTY_ORDER.indexOf(quest.difficulty);
        if (difficultyIndex === 0) return false;
        const easierDifficulty = QUEST_DIFFICULTY_ORDER[difficultyIndex - 1];
        const easierQuestID = getQuestIdByCategoryAndDifficulty(quest.category, easierDifficulty);

        // is too advanced if even the easier version of the quest hasn't been completed yet
        return easierQuestID && !getQuestStatus(me.quest_progress, easierQuestID).completed;
      }
      if (isTooAdvanced()) return false;

      return true;
    });


    const getDifficultyIndex = (questID: QuestID) => {
      const quest = getQuest(questID);
      return QUEST_DIFFICULTY_ORDER.indexOf(quest.difficulty);
    }

    const getPercentDone = (questID: QuestID) => {
      const quest = getQuest(questID);
      const status = getQuestStatus(me.quest_progress, questID);
      return status.currentScore / quest.targetScore;
    }

    // Sort by closest to complete, and tiebreaker easiest to hardest
    questIDs.sort((questIDA, questIDB) => getDifficultyIndex(questIDA) - getDifficultyIndex(questIDB));
    questIDs.sort((questIDA, questIDB) => getPercentDone(questIDB) - getPercentDone(questIDA));

    // Get the two closest ongoing quests
    return questIDs.slice(0, 2).map(questID => ({ questID, progress: getQuestStatus(me.quest_progress, questID).currentScore }) );
  }

}
