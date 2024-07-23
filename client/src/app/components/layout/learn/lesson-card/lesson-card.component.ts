import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonColor } from 'src/app/components/ui/solid-button/solid-button.component';
import { Difficulty, DIFFICULTY_COLORS } from 'src/app/shared/models/difficulty';
import { LessonHeader } from 'src/app/shared/models/lesson';

@Component({
  selector: 'app-lesson-card',
  templateUrl: './lesson-card.component.html',
  styleUrls: ['./lesson-card.component.scss']
})
export class LessonCardComponent {
  @Input() lesson!: LessonHeader;

  readonly ButtonColor = ButtonColor;

  constructor(
    private router: Router
  ) {}

  startLesson() {
    // route to /learn/lesson/:filename
    console.log("Starting lesson:", this.lesson.filename);
    this.router.navigate(['/learn/lesson'], { queryParams: { id: this.lesson.filename } });
  }

  getLessonColor() {
    return DIFFICULTY_COLORS[this.lesson.difficulty];
  }

  getDifficulty(): string {
    switch (this.lesson.difficulty) {
      case Difficulty.CORE:
        return "Core";
      case Difficulty.NOVICE:
        return "Novice";
      case Difficulty.INTERMEDIATE:
        return "Intermediate";
      case Difficulty.ADVANCED:
        return "Advanced";
    }
  }

}
