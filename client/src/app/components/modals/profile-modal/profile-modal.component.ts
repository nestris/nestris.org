import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { MeService } from 'src/app/services/state/me.service';
import { DBUser, DBUserWithOnlineStatus } from 'src/app/shared/models/db-user';
import { League, LEAGUE_NAMES, leagueColor } from 'src/app/shared/nestris-org/league-system';
import { ALL_QUEST_IDS, getQuest, getQuestStatus, QuestID } from 'src/app/shared/nestris-org/quest-system';
import { QuestListModalConfig } from '../quest-list-modal/quest-list-modal.component';
import { ApiService } from 'src/app/services/api.service';

export interface ModalData {
  dbUser: DBUser;
  online: boolean;
}

export interface ProfileModalConfig {
  userid?: string;
}

@Component({
  selector: 'app-profile-modal',
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileModalComponent implements OnInit {
  @Input() config?: ProfileModalConfig;

  readonly leagueColor = leagueColor;

  readonly dateString = (date: Date) => date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  readonly leagueName = (user: DBUser) => LEAGUE_NAMES[user.league as League];

  public data$ = new BehaviorSubject<ModalData | null>(null);

  constructor(
    public readonly meService: MeService,
    public readonly modalManagerService: ModalManagerService,
    public readonly apiService: ApiService,
  ) {}

  async ngOnInit() {
    const data = await this.getData();
    this.data$.next(data);
  }

  private async getData(): Promise<ModalData> {

    const dbUser: DBUser | DBUserWithOnlineStatus = this.config?.userid ? (await this.apiService.getUserByID(this.config.userid)) : (await this.meService.get());
    const online = this.config?.userid ? (dbUser as DBUserWithOnlineStatus).online : true;
    return { dbUser, online };
  }

  // Show the 6 best completed quests by the user
  getCompletedQuests(user: DBUser): QuestID[] {

    // Filter to only completed quests
    const questIDs = ALL_QUEST_IDS.filter(questID => getQuestStatus(user.quest_progress, questID).completed);
  
    const getXP = (questID: QuestID) => getQuest(questID).xp;

    // Sort by XP from hardest to easiest
    questIDs.sort((questIDA, questIDB) => getXP(questIDB) - getXP(questIDA));

    // Get the 6 hardest completed quests
    const completed = questIDs.slice(0, 6);
    console.log("completed", completed);
    if (completed.length <= 3) completed.length = 3;
    else completed.length = 6;
    return completed;
  }


  showQuests() {
    // Show quest modal, which when closes reopens profile modal
    const config: QuestListModalConfig = {
      user: this.config?.userid ? this.data$.getValue()!.dbUser : undefined
    };
    this.modalManagerService.showModal(ModalType.QUEST_LIST, config, () => {
      this.modalManagerService.showModal(ModalType.PROFILE, {userid : this.config?.userid});
    });
  }

}
