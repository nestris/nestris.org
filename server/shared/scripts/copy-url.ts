import { PuzzleMode } from "client/src/app/components/layout/play-puzzle/play-puzzle-page/play-puzzle-page.component";
import { NotificationService } from "client/src/app/services/notification.service";
import { NotificationType } from "network-protocol/models/notifications";

export function copyPuzzleLink(notifier: NotificationService, puzzleID: string) {

  // generate the url of the puzzle
  const currentURL = new URL(window.location.href); // need to extract base url
  const puzzleURL = new URL(currentURL.origin + "/online/puzzle");
  puzzleURL.searchParams.set('mode', PuzzleMode.SINGLE);
  puzzleURL.searchParams.set('id', puzzleID);

  // copy the url to clipboard
  navigator.clipboard.writeText(puzzleURL.toString());
  console.log("Copied puzzle link to clipboard", puzzleURL.toString());

  // notify the user that the link has been copied
  notifier.notify(NotificationType.SUCCESS, "Puzzle link copied to clipboard");
}