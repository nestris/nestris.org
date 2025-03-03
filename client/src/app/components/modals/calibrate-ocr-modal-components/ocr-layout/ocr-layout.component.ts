import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FrameWithContext } from 'src/app/services/ocr/video-capture.service';
import { OCRFrameData } from '../calibrate-ocr-modal/calibrate-ocr-modal.component';
import { TetrominoType } from 'src/app/shared/tetris/tetromino-type';
import MoveableTetromino from 'src/app/shared/tetris/moveable-tetromino';
import { TetrisBoard } from 'src/app/shared/tetris/tetris-board';

@Component({
  selector: 'app-ocr-layout',
  templateUrl: './ocr-layout.component.html',
  styleUrls: ['./ocr-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcrLayoutComponent implements OnChanges {
  @Input() frameWithContext: FrameWithContext | null | undefined = null;
  @Input() ocrFrameData: OCRFrameData | null | undefined = undefined;
  @Input() error: string = "An error occured";

  readonly TetrominoType = TetrominoType;

  colorBoard = new TetrisBoard();

  // Only re-render on changes to board
  ngOnChanges(changes: SimpleChanges): void {
    if (this.frameWithContext?.ocrFrame) {
      const newBoard = this.frameWithContext.ocrFrame.getColorBoard(this.ocrFrameData?.level ?? 18);
      if (!this.colorBoard.equals(newBoard)) {
        this.colorBoard = newBoard;
      }
    }
    
  }
}
