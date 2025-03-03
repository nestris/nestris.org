import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { MeService } from 'src/app/services/state/me.service';
import { DBUser, DBUserWithOnlineStatus } from 'src/app/shared/models/db-user';
import { League, LEAGUE_NAMES, leagueColor, previousLeague } from 'src/app/shared/nestris-org/league-system';
import { ALL_QUEST_IDS, getQuest, getQuestStatus, QUEST_COLORS, QuestID } from 'src/app/shared/nestris-org/quest-system';
import { QuestListModalConfig } from '../quest-list-modal/quest-list-modal.component';
import { ApiService } from 'src/app/services/api.service';
import { Activity, ActivityType, TimestampedActivity } from 'src/app/shared/models/activity';
import { numberWithCommas } from 'src/app/util/misc';

export interface ModalData {
  dbUser: DBUser;
  online: boolean;
}

export interface ProfileModalConfig {
  userid?: string;
  originalUrl?: string; // The url to redirect to when modal closes. Defaults to the existing url when the modal was opened
}

interface ActivityGroup {
  date: Date,
  activities: Activity[],
}

@Component({
  selector: 'app-profile-modal',
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileModalComponent implements OnInit, OnDestroy {
  @Input() config?: ProfileModalConfig;

  readonly leagueColor = leagueColor;
  readonly previousLeague = previousLeague;
  readonly ActivityType = ActivityType;
  readonly abs = Math.abs;
  readonly numberWithCommas = numberWithCommas;

  readonly dateString = (date: Date) => date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  readonly leagueName = (league: League) => LEAGUE_NAMES[league];
  readonly questName = (questID: QuestID) => getQuest(questID).name;
  readonly questXP = (questID: QuestID) => getQuest(questID).xp;
  readonly questColor = (questID: QuestID) => QUEST_COLORS[getQuest(questID).difficulty];

  private userid!: string;

  public data$ = new BehaviorSubject<ModalData | null>(null);
  public activities$ = new BehaviorSubject<ActivityGroup[] | null>(null);

  private originalUrl!: string;

  constructor(
    public readonly meService: MeService,
    public readonly modalManagerService: ModalManagerService,
    public readonly apiService: ApiService,
    private readonly fetchService: FetchService,
    private location: Location
  ) {}

  ngOnInit() {
    // userid of the shown profile
    this.userid = this.config?.userid ?? this.meService.getUserIDSync()!;

    this.getData().then(data => this.data$.next(data))
    this.fetchActivities().then(activities => this.activities$.next(activities));
    
    // Temporarily change to profile url
    this.originalUrl = this.config?.originalUrl ?? this.location.path();
    this.location.replaceState(`user/${this.userid}`);
  }

  ngOnDestroy(): void {
    // Go back to original url
    this.location.replaceState(this.originalUrl);
  }

  private async getData(): Promise<ModalData> {

    const dbUser: DBUser | DBUserWithOnlineStatus = this.config?.userid ? (await this.apiService.getUserByID(this.config.userid)) : (await this.meService.get());
    const online = this.config?.userid ? (dbUser as DBUserWithOnlineStatus).online : true;
    return { dbUser, online };
  }

  private async fetchActivities(): Promise<ActivityGroup[]> {
    const activities = await this.fetchService.fetch<TimestampedActivity[]>(Method.GET, `/api/v2/activities/${this.userid}`);

    // Group activities by local date
    const activityMap = new Map<string, Activity[]>();
    
    for (const { timestamp, activity } of activities) {
        const localDate = new Date(timestamp).toLocaleDateString();
        if (!activityMap.has(localDate)) {
            activityMap.set(localDate, []);
        }
        activityMap.get(localDate)!.push(activity);
    }
    
    // Convert map to array and ensure ordering from most recent to least recent
    const activityGroups = Array.from(activityMap.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, activities]) => ({
          date: new Date(date),
          activities
      }));
      
    return activityGroups;
  
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
    }, false);
  }

  goToProfile(userid: string) {
    this.modalManagerService.hideModal();
    const config: ProfileModalConfig = { userid }
    this.modalManagerService.showModal(ModalType.PROFILE, config);
  }

  activityDateString(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toLocaleDateString() === today.toLocaleDateString()) return "Today";
    if (date.toLocaleDateString() === yesterday.toLocaleDateString()) return "Yesterday";
    return this.dateString(date);
  }

  static readonly ACTIVITY_ICONS: {[type in ActivityType] : string} = {
    [ActivityType.LEAGUE_PROMOTION] : 'league',
    [ActivityType.PERSONAL_BEST] : 'pb',
    [ActivityType.PUZZLE_ELO] : 'puzzle',
    [ActivityType.QUEST_COMPLETION] : 'quest',
    [ActivityType.RANKED_MATCH] : 'trophies'
  };
  getIcon(activityType: ActivityType) {
    const name = ProfileModalComponent.ACTIVITY_ICONS[activityType];
    return `./assets/img/activity-icons/${name}.svg`
  }

}
