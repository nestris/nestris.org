import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';
import { ActivatedRoute } from '@angular/router';
import { Method, fetchServer } from 'client/src/app/scripts/fetch-server';
import { WebsocketService } from 'client/src/app/services/websocket.service';
import { SerializedPuzzle } from 'server/puzzles/decode-puzzle';

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

  public allUserFolders: string[] = []; // all folders made by the user
  public openedFolderName: string | undefined = undefined; // the name of the folder that is currently opened
  public puzzlesInCurrentFolder: string[] = []; // all puzzles in the current folder

  // if allUserFolders does not contain openedFolder, means that the folder is not made by the user,
  // and should show option to import the folder to user

  async ngOnInit() {
    

    // if not signed in, do not fetch any data
    if (!this.websocketService.isSignedIn()) {
      this.websocketService.onSignIn().subscribe(() => {
        this.ngOnInit();
      });
    }

    const username = this.websocketService.getUsername();

    // read folder query param
    this.activatedRoute.queryParams.subscribe(async (params) => {
      const folderID = params['folder'] as (string | undefined);

      // if folder is undefined, then it should show all puzzles made by the user
      if (folderID === undefined) { // fetch all puzzles by the user
        this.openedFolderName = undefined; // no folder is opened
        console.log("No folder is opened. Fetching all puzzles by the user...");

        const {content, status} = await fetchServer(Method.GET, `/api/v2/puzzles-by-user/${username}`);
        const userPuzzles = content as SerializedPuzzle[];

        console.log("User puzzles:", userPuzzles);
        
        
      } else { // fetch all puzzles in the folder
        console.log("Fetching all puzzles in the folder with ID:", folderID);
      }


    });

  }

  openCreatePuzzleModal() {
    this.modalManager.showModal(ModalType.CREATE_PUZZLE);
  }

}
