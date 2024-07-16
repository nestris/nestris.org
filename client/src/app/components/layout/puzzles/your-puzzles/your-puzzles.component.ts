import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { fetchServer, Method } from 'src/app/scripts/fetch-server';
import { ModalManagerService, ModalType } from 'src/app/services/modal-manager.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { PlayerPuzzle } from 'src/app/shared/puzzles/player-puzzle';

@Component({
  selector: 'app-your-puzzles',
  templateUrl: './your-puzzles.component.html',
  styleUrls: ['./your-puzzles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourPuzzlesComponent implements OnInit {

  readonly ButtonColor = ButtonColor;

  constructor(
    private modalManager: ModalManagerService,
    private activatedRoute: ActivatedRoute,
    public websocketService: WebsocketService
  ) {}

  public allUserFolders$ = new BehaviorSubject<string[]>([]); // all folders made by the user
  public openedFolderName$ = new BehaviorSubject<string | undefined>(undefined); // the name of the folder that is currently opened
  public puzzlesInCurrentFolder$ = new BehaviorSubject<PlayerPuzzle[]>([]); // all puzzles in the current folder

  // if allUserFolders does not contain openedFolder, means that the folder is not made by the user,
  // and should show option to import the folder to user

  ngOnInit() {

    // refresh the page when a puzzle is created
    this.modalManager.onHideModal$().subscribe((modal) => {
      if (modal === ModalType.CREATE_PUZZLE) {
        console.log("Puzzle created. Refreshing the page...");
        this.syncWithServer();
      }
    });

    // if not signed in, do not fetch any data
    if (!this.websocketService.isSignedIn()) {
      this.websocketService.onSignIn().subscribe(() => {
        this.syncWithServer();
      });

    } else { // if signed in, fetch the data
      this.syncWithServer();
    }

  }

  syncWithServer() {

    const username = this.websocketService.getUsername();

    // read folder query param
    this.activatedRoute.queryParams.subscribe(async (params) => {
      const folderID = params['folder'] as (string | undefined);

      // if folder is undefined, then it should show all puzzles made by the user
      if (folderID === undefined) { // fetch all puzzles by the user
        this.openedFolderName$.next(undefined); // no folder is opened
        console.log("No folder is opened. Fetching all puzzles by the user...");

        const {content, status} = await fetchServer(Method.GET, `/api/v2/puzzles-by-user/${username}`);
        console.log("Fetched all puzzles by the user:", content);      
        this.puzzlesInCurrentFolder$.next(content as PlayerPuzzle[]); 
        
      } else { // fetch all puzzles in the folder
        console.log("Fetching all puzzles in the folder with ID:", folderID);
      }

    });

  }

  openCreatePuzzleModal() {
    this.modalManager.showModal(ModalType.CREATE_PUZZLE);
  }

  // remove the puzzle from the list (front-end only)
  deletePuzzle(puzzle: PlayerPuzzle) {
    this.puzzlesInCurrentFolder$.next(this.puzzlesInCurrentFolder$.value.filter(p => p.id !== puzzle.id));
  }

}
