import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../../ui/solid-button/solid-button.component';
import { ModalManagerService, ModalType } from 'client/src/app/services/modal-manager.service';

@Component({
  selector: 'app-your-puzzles',
  templateUrl: './your-puzzles.component.html',
  styleUrls: ['./your-puzzles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YourPuzzlesComponent {

  readonly ButtonColor = ButtonColor;

  constructor(
    private modalManager: ModalManagerService
  ) {}

  openCreatePuzzleModal() {
    this.modalManager.showModal(ModalType.CREATE_PUZZLE);
  }

}
