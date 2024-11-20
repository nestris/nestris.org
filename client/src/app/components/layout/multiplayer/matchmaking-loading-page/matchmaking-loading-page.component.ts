import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, interval, map, Subscription } from "rxjs";
import { RankedQueueService } from "src/app/services/room/ranked-queue.service";
import { MeService } from "src/app/services/state/me.service";
import { getLeagueFromIndex } from "src/app/shared/nestris-org/league-system";
import { FoundOpponentMessage } from "src/app/shared/network/json-message";


@Component({
  selector: 'app-matchmaking-loading-page',
  templateUrl: './matchmaking-loading-page.component.html',
  styleUrls: ['./matchmaking-loading-page.component.scss']
})
export class MatchmakingLoadingPageComponent implements OnInit, OnDestroy {

    score: number = 0;
    scoreVisible: boolean = false;

    numPeriods$: BehaviorSubject<number> = new BehaviorSubject(0);
    intervalSubscription!: Subscription;


    constructor(
        private meService: MeService,
        private rankedQueueService: RankedQueueService,
        private router: Router,
    ) {}

    readonly playersInQueue$ = this.rankedQueueService.getNumQueuingPlayers$();
    readonly foundOpponent$ = this.rankedQueueService.getFoundOpponent$();

    readonly me$ = this.meService.get$();
    
    async ngOnInit() {

        // rotate between '', '.', '..', '...' for the periods
        this.intervalSubscription = interval(500).subscribe(() => {
            this.numPeriods$.next((this.numPeriods$.value + 1) % 4);
        });

        // Join the ranked queue, if not already in queue
        const success = await this.rankedQueueService.joinQueue();
        
        // If the user was not successfully added to the queue, navigate back to home
        if (!success) this.router.navigate(['/']);   
    }

    async ngOnDestroy() {

        // Leave the ranked queue
        await this.rankedQueueService.leaveQueue();

        this.intervalSubscription.unsubscribe();
    }

    getMessage(periods: number) {
      return "Searching for opponent" + ('.'.repeat(periods));
    }

    setScore(score: number) {
        this.score = score;
        if (score > 0) this.scoreVisible = true;
    }

}
