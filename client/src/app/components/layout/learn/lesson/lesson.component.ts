import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { fetchServer2, Method } from 'src/app/scripts/fetch-server';
import { Lesson } from 'src/app/shared/models/lesson';

@Component({
  selector: 'app-lesson',
  templateUrl: './lesson.component.html',
  styleUrls: ['./lesson.component.scss']
})
export class LessonComponent implements OnInit {

  lesson$ = new BehaviorSubject<Lesson | undefined>(undefined);

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  routeToDashboard() {
    this.router.navigate(['/learn']);
  }

  async ngOnInit() {
    this.route.queryParamMap.subscribe(async (params: any) => {

      const lessonID = params.get('id');
      if (!lessonID) {
        console.error("No lesson ID provided");
        //this.routeToDashboard();
        return;
      }

      // Fetch lesson by ID
      try {
        this.lesson$.next(await fetchServer2<Lesson>(Method.GET, `/api/v2/lesson/${lessonID}`));
      } catch (error) {
        console.error("Failed to fetch lesson:", error);
        this.routeToDashboard();
      }
    })
  }

}
