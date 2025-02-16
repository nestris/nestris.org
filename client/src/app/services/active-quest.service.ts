import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { QuestID } from '../shared/nestris-org/quest-system';

@Injectable({
  providedIn: 'root'
})
export class ActiveQuestService {

  public activeQuestID$ = new BehaviorSubject<QuestID | null>(null);
}
