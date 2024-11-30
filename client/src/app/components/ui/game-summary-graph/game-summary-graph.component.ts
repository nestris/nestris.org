import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { getGravity } from 'src/app/shared/tetris/gravity';
import { MemoryGameStatus, StatusHistory } from 'src/app/shared/tetris/memory-game-status';
import { ColorType } from 'src/app/shared/tetris/tetris-board';
import { COLOR_FIRST_COLORS_RGB, COLOR_SECOND_COLORS_RGB, getColorForLevel, RGBColor } from 'src/app/shared/tetris/tetromino-colors';


interface LevelSection {
  level: number; // the speed level
  startLines: number; // the number of lines cleared at the start of the level
  color: string; // the color of the level
  startFraction: number; // fraction to align with the start of the section
  fraction: number; // fraction of entire game between 0 and 1
}

interface Annotation {
  text: string;
  trt: number;
  lines: number;
}

@Component({
  selector: 'app-game-summary-graph',
  templateUrl: './game-summary-graph.component.html',
  styleUrls: ['./game-summary-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameSummaryGraphComponent implements OnInit {
  @Input() game!: MemoryGameStatus;

  // Chart dimensions
  readonly WIDTH = 600;
  readonly ANNOTATION_HEIGHT = 40;
  readonly CONTENT_HEIGHT = 70;
  readonly LABEL_HEIGHT = 15;
  readonly HEIGHT = this.ANNOTATION_HEIGHT + this.CONTENT_HEIGHT + this.LABEL_HEIGHT;

  // Y positions for the grid lines
  readonly GRID_LINE_PADDING_TOP = 5;
  readonly GRID_LINE_PADDING_BOTTOM = 0.5;
  readonly GRID_LINE_Y = [0, 0.25, 0.5, 0.75, 1].map(i => this.trtToY(i));

  TOTAL_LINES!: number;
  history!: StatusHistory;
  levelSections!: LevelSection[];
  annotations: Annotation[] = [];
  polygon: string = '';
  polylineInterpolate: string = '';

  GRAVITY_COLOR_MAP: { [key: number]: RGBColor } = {
    1: COLOR_FIRST_COLORS_RGB[9], // red for 29
    2: COLOR_SECOND_COLORS_RGB[9], // orange for 19
    3: COLOR_FIRST_COLORS_RGB[8], // blue for 18
    4: COLOR_FIRST_COLORS_RGB[5], // green for 15
    5: COLOR_FIRST_COLORS_RGB[2], // purple for 12
    6: COLOR_SECOND_COLORS_RGB[9], // orange for 9
    8: COLOR_FIRST_COLORS_RGB[8], // blue for 8
  };

  readonly COLOR_TYPE_FOR_LEVEL: { [key: number]: ColorType } = {
    0 : ColorType.SECONDARY,
    1 : ColorType.SECONDARY,
    2 : ColorType.SECONDARY,
    3 : ColorType.SECONDARY,
    4 : ColorType.PRIMARY,
    5 : ColorType.PRIMARY,
    6 : ColorType.SECONDARY,

    7 : ColorType.SECONDARY,
    8 : ColorType.PRIMARY,
    9 : ColorType.PRIMARY,
  }

  ngOnInit(): void {
    this.history = this.game.getHistory();

    // ensure there is at least one line
    this.TOTAL_LINES = Math.max(1, this.game.lines);

    this.levelSections = this.getLevelSections();

    this.annotations = this.getAnnotations();
    
    const points = this.getGraphPoints();
    this.polylineInterpolate = this.polylinePoints(points, true);
    this.polygon = this.makePolygon(this.polylineInterpolate);
  }

  private trtToY(trt: number): number {
    return this.ANNOTATION_HEIGHT + this.GRID_LINE_PADDING_TOP + ((1 - trt) * (this.CONTENT_HEIGHT - this.GRID_LINE_PADDING_TOP - this.GRID_LINE_PADDING_BOTTOM));
  }

  private getColorForLevel(level: number): string {
    if (level <= 7) return getColorForLevel(this.COLOR_TYPE_FOR_LEVEL[level], level)
    return this.GRAVITY_COLOR_MAP[getGravity(level)].toString();
  }

  private getLevelSections(): LevelSection[] {

    const sections: LevelSection[] = [];

    // Add the first section
    sections.push({
      level: this.game.startLevel,
      startLines: 0,
      color: this.getColorForLevel(this.game.startLevel),
      startFraction: -1, // will be updated later
      fraction: -1 // will be updated later
    });

    // Derive the level sections from the snapshots
    for (let i = 0; i < this.history.length(); i++) {
      const snapshot = this.history.getSnapshot(i);

      // If speed has changed, add a new section
      if (getGravity(snapshot.level) !== getGravity(sections[sections.length - 1].level)) {
        sections.push({
          level: snapshot.level,
          startLines: Math.floor(snapshot.lines / 10) * 10, // round down to nearest 10
          color: this.getColorForLevel(snapshot.level),
          startFraction: -1, // will be updated later
          fraction: -1 // will be updated later
        });
      }
    }

    // Calculate the fraction of the game each section represents in terms of lines cleared
    let currentFraction = 0;
    for (let i = 0; i < sections.length; i++) {
      const startLines = sections[i].startLines;
      const endLines = i === sections.length - 1 ? this.TOTAL_LINES : sections[i + 1].startLines;
      sections[i].startFraction = currentFraction;
      sections[i].fraction = (endLines - startLines) / this.TOTAL_LINES;

      currentFraction += sections[i].fraction;
    }

    console.log(sections);
    return sections;
  }

  public getSectionStartX(section: LevelSection): number {
    return section.startFraction * this.WIDTH;
  }

  public getSectionWidth(section: LevelSection): number {
    return section.fraction * this.WIDTH;
  }

  private getAnnotations(): Annotation[] {
    const annotations: Annotation[] = [];

    let previousGravity = getGravity(this.game.startLevel);

    const SCORE_MILESTONES = [
      100000,
      500000,
      1000000,
      1100000,
      1200000,
      1300000,
      1400000,
      1500000,
      1600000,
    ]
    let nextMilestoneIndex = 0;

    for (let i = 0; i < this.history.length(); i++) {
      const snapshot = this.history.getSnapshot(i);

      // Annotate on score milestones
      if (snapshot.score >= SCORE_MILESTONES[nextMilestoneIndex]) {
        annotations.push({
          text: `${snapshot.score}`,
          trt: snapshot.tetrisRate,
          lines: snapshot.lines
        });
        nextMilestoneIndex++;
      }
      
      // Annotate on transitions to new gravity levels
      if (getGravity(snapshot.level) !== previousGravity) {
        annotations.push({
          text: `${snapshot.score}`,
          trt: snapshot.tetrisRate,
          lines: snapshot.lines
        });
        previousGravity = getGravity(snapshot.level);
      }
    }

    console.log("Annotations", annotations);
    return annotations;
  }

  // Given snapshots, return a list of tuples (lines, trt) for each snapshot
  // Set trt of all lines < 14 to the snapshot with as close to 14 lines as possible
  private getGraphPoints(): [number, number][] {

    // First, get raw points
    const points: [number, number][] = [];
    points.push([0, 0]);
    for (let i = 0; i < this.history.length(); i++) {
      const snapshot = this.history.getSnapshot(i);
      const lines = snapshot.lines;
      const trt = snapshot.tetrisRate;

      points.push([lines, trt]);
    }

    if (points.length === 1) points.push([1, 0]);

    // make deep copy of points
    const pointsCopy = JSON.parse(JSON.stringify(points));
    console.log("Unadjusted points", pointsCopy);

    const THRESHOLD = 10;
    
    // Get trt of snapshot with lines closest to 14
    let distanceTo14 = 20;
    let trtAt14 = 0;
    for (let i = 0; i < points.length; i++) {
      const [lines, trt] = points[i];
      if (Math.abs(lines - THRESHOLD) < distanceTo14) {
        distanceTo14 = Math.abs(lines - THRESHOLD);
        trtAt14 = trt;
      }
      if (lines >= THRESHOLD + 4) break;
    }

    // Adjust trt of all snapshots with lines < 14 to the trt at 14
    for (let i = 0; i < points.length; i++) {
      const [lines, trt] = points[i];
      if (lines < THRESHOLD) points[i][1] = trtAt14;
      if (lines >= THRESHOLD) break;
    }
    console.log("Adjusted points", points);

    return points;
  }

  // given points in form (lines, trt), return a string for a polyline converted into (x, y) coordinates
  private polylinePoints(points: [number, number][], interpolate: boolean): string {

    // First, convert points to (x, y) coordinates
    let coordinates: [number, number][] = points.map(([lines, trt]) => {
      const x = this.WIDTH * (lines / this.TOTAL_LINES);
      const y = this.trtToY(trt);
      return [x, y];
    });

    // Next, inject waypoints to smooth out the polyline
    if (interpolate) {


      if (coordinates.length > 20) {
        // Keep only every nth point, and the last point
        coordinates = coordinates.filter(([lines, trt], i) => (
          (
            (i % 3 === 0 || i === coordinates.length - 1) && // keep every 3rd point and the last point
            !this.annotations.some(annotation => Math.abs(annotation.lines - lines) < 4) // do not keep points around annotations
          )
          || 
          ( 
            this.annotations.some(annotation => annotation.lines === lines) // keep points exactly at annotations
          )
        ));
      }

      const resolution = Math.ceil(500 / coordinates.length);
      console.log("Resolution", resolution);
      coordinates = this.smoothPath(coordinates, resolution, 0.4);
    }
    

    console.log("Smoothed coordinates", coordinates);

    // Finally, onvert coordinates to a string
    return coordinates.map(([x, y]) => `${x},${y}`).join(' ');
  }

  // add the bottom left and bottom right corners to the polyline to close the shape
  private makePolygon(polyline: string): string {
    const bottomLeft = `0,${this.ANNOTATION_HEIGHT + this.CONTENT_HEIGHT}`;
    const bottomRight = `${this.WIDTH},${this.ANNOTATION_HEIGHT + this.CONTENT_HEIGHT}`;
    return `${polyline} ${bottomRight} ${bottomLeft}`;
  }


  /**
 * Smooth a list of points by injecting waypoints.
 * @param points - The list of points to smooth (array of [x, y]).
 * @param resolution - Number of waypoints to inject between two points (higher = denser).
 * @param tension - Smoothness factor (0 = sharp corners, 1 = very smooth).
 * @returns A new list of points with injected waypoints (array of [x, y]).
 */
  private smoothPath(
    points: [number, number][],
    resolution: number = 10,
    tension: number = 0.5
  ): [number, number][] {
    if (points.length < 2) {
      throw new Error("At least two points are required to smooth the path.");
    }

    const smoothPoints: [number, number][] = [];

    // Helper function: Interpolate between two points using a Catmull-Rom spline
    const interpolate = (
      p0: [number, number],
      p1: [number, number],
      p2: [number, number],
      p3: [number, number],
      t: number
    ): [number, number] => {
      const t2 = t * t;
      const t3 = t2 * t;

      const a = -tension * t3 + 2 * tension * t2 - tension * t;
      const b = (2 - tension) * t3 + (tension - 3) * t2 + 1;
      const c = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * t;
      const d = tension * t3 - tension * t2;

      return [
        a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
        a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
      ];
    };

    // Loop through points, generating waypoints between them
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      smoothPoints.push(p1); // Add the current point
      for (let j = 1; j <= resolution; j++) {
        const t = j / resolution; // Interpolation factor
        const waypoint = interpolate(p0, p1, p2, p3, t);
        smoothPoints.push(waypoint);
      }
    }

    // Ensure the last point is added
    smoothPoints.push(points[points.length - 1]);

    return smoothPoints;
  }

  annotationX(annotation: Annotation): number {
    return this.WIDTH * (annotation.lines / this.TOTAL_LINES);
  }

  annotationY(annotation: Annotation): number {
    return this.trtToY(annotation.trt);
  }

  
}
