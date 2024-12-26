import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Host, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Rectangle } from 'src/app/ocr/util/rectangle';
import { getGravity } from 'src/app/shared/tetris/gravity';
import { MemoryGameStatus, StatusHistory, StatusSnapshot } from 'src/app/shared/tetris/memory-game-status';
import { ColorType } from 'src/app/shared/tetris/tetris-board';
import { COLOR_FIRST_COLORS_RGB, COLOR_SECOND_COLORS_RGB, getColorForLevel, RGBColor } from 'src/app/shared/tetris/tetromino-colors';
import { numberWithCommas } from 'src/app/util/misc';


interface LevelSection {
  level: number; // the speed level
  startLines: number; // the number of lines cleared at the start of the level
  color: string; // the color of the level
  startFraction: number; // fraction to align with the start of the section
  fraction: number; // fraction of entire game between 0 and 1
}

interface Annotation {
  text: string;
  lines: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-game-summary-graph',
  templateUrl: './game-summary-graph.component.html',
  styleUrls: ['./game-summary-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameSummaryGraphComponent implements OnChanges, AfterViewInit {
  @ViewChild('graph') graph!: ElementRef;
  @Input() game!: MemoryGameStatus;
  @Input() WIDTH: number = 600;
  @Input() currentPlacement: number | null = null; // If not null, display a vertical line at the current placement
  @Input() placementPercent: number = 0; // a number from 0-1, where 0 is at a placement and 1 is the next placement
  @Input() showHoverPlacement: boolean = false;
  
  @Output() clickPlacement = new EventEmitter<number>();

  mouseX$ = new BehaviorSubject<number | null>(null);

  // Chart dimensions
  readonly ANNOTATION_HEIGHT = 30;
  readonly CONTENT_HEIGHT = 70;
  readonly LABEL_HEIGHT = 15;
  readonly HEIGHT = this.ANNOTATION_HEIGHT + this.CONTENT_HEIGHT + this.LABEL_HEIGHT;

  // Y positions for the grid lines
  readonly GRID_LINE_PADDING_TOP = 5;
  readonly GRID_LINE_PADDING_BOTTOM = 0.5;
  readonly GRID_LINE_Y = [0, 0.25, 0.5, 0.75, 1].map(i => this.trtToY(i));

  svgRect$ = new BehaviorSubject<Rectangle | null>(null);

  placementX$ = new BehaviorSubject<number | null>(null);

  TOTAL_LINES!: number;
  history!: StatusHistory;
  levelSections!: LevelSection[];
  annotations: Annotation[] = [];
  polygon: string = '';
  points!: [number, number][];
  polylineString!: string;

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

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['game']) {

      this.history = this.game.getHistory();

      // ensure there is at least one line
      this.TOTAL_LINES = Math.max(1, this.game.lines);

      this.levelSections = this.getLevelSections();
    }

    if (changes['game'] || changes['WIDTH']) {
    
      const points = this.getGraphPoints();
      this.points = this.polylinePoints(points, true);

      this.polylineString = this.points.map(([x, y]) => `${x},${y}`).join(' ');
      this.polygon = this.makePolygon(this.polylineString);

      this.annotations = this.generateAnnotations();

    }

    // Always update the placement x
    if (this.currentPlacement !== null) {
      let placementX: number;
      if (this.placementPercent === 0) {
        placementX = this.getPlacementX(this.currentPlacement);
      } else {
        const placementX1 = this.getPlacementX(this.currentPlacement);
        const placementX2 = this.getPlacementX(this.currentPlacement + 1);
        placementX = placementX1 + (placementX2 - placementX1) * this.placementPercent;
      }
      this.placementX$.next(placementX);
    }
  }

  ngAfterViewInit(): void {
    this.onResize();
    setInterval(() => {
      this.mouseX$.next(0);
      this.mouseX$.next(null);
    }, 1000);
    
  }

  // on window resize, update the svgRect
  @HostListener('window:resize')
  onResize(): void {
    const rect = this.graph.nativeElement.getBoundingClientRect();

    this.svgRect$.next({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right
    });
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

    return sections;
  }

  public getSectionStartX(section: LevelSection): number {
    return section.startFraction * this.WIDTH;
  }

  public getSectionWidth(section: LevelSection): number {
    return section.fraction * this.WIDTH;
  }

  private getPlacementX(placement: number): number {

    // Get the closest snapshots before and after the placement
    let i = 0;
    while (i < this.history.length() && this.history.getSnapshot(i).placement < placement) {
      i++;
    }

    // If out of bounds, return the end of the game
    if (i === this.history.length()) return this.WIDTH;


    // If the placement is exactly at a snapshot, return the x value of that snapshot
    if (this.history.getSnapshot(i).placement === this.currentPlacement) {
      return this.getXFromLines(this.history.getSnapshot(i).lines);
    }

    // If the placement is after the last snapshot, interpolate between the last snapshot and the end of the game
    if (i === this.history.length()) {
      const snapshot = this.history.getSnapshot(i - 1);
      const numPlacements = this.game.getTotalPlacementCount();
      const snapshotX = this.getXFromLines(snapshot.lines);
      const endX = this.WIDTH;
      return snapshotX + (endX - snapshotX) * ((placement - snapshot.placement) / (numPlacements - snapshot.placement));
    }

    // Otherwise, interpolate between the two closest snapshots
    const snapshot1 = this.history.getSnapshot(i - 1);
    const snapshot2 = this.history.getSnapshot(i);
    const x1 = this.getXFromLines(snapshot1.lines);
    const x2 = this.getXFromLines(snapshot2.lines);
    const placement1 = snapshot1.placement;
    const placement2 = snapshot2.placement;
    return x1 + (x2 - x1) * ((placement - placement1) / (placement2 - placement1));
  }

  private generateAnnotations(): Annotation[] {
    const annotations: Annotation[] = [];

    // Determine score milestones based on the total score
    let SCORE_MILESTONES: number[];
    if (this.game.score < 100000) SCORE_MILESTONES = [50000];
    else if (this.game.score < 500000) SCORE_MILESTONES = [100000, 200000, 300000, 400000];
    else if (this.game.score < 1000000) SCORE_MILESTONES = [200000, 400000, 600000, 800000];
    else SCORE_MILESTONES = [500000, 1000000, 1100000, 1200000, 1300000, 1400000, 1500000, 1600000, 1700000, 1800000];
  
    const addAnnotation = (snapshot: StatusSnapshot, score: number) => {
      const x = this.getXFromLines(snapshot.lines);
      annotations.push({
        text: this.condenseScore(score),
        lines: snapshot.lines,
        x: x,
        y: this.getHoverY(x)
      });
    }

    // Annotate on transitions to new gravity levels
    let previousGravity = getGravity(this.game.startLevel);
    for (let i = 0; i < this.history.length(); i++) {
      const snapshot = this.history.getSnapshot(i);

      if (getGravity(snapshot.level) !== previousGravity) {
        addAnnotation(snapshot, snapshot.score);
        previousGravity = getGravity(snapshot.level);
      }
    }

    // Annotate on score milestones
    let nextMilestoneIndex = 0;
    for (let i = 0; i < this.history.length(); i++) {
      const snapshot = this.history.getSnapshot(i);

      if (snapshot.score >= SCORE_MILESTONES[nextMilestoneIndex]) {

        // if score lines is not close to existing annotation, add a new annotation
        if (!annotations.find(annotation => Math.abs(annotation.lines - snapshot.lines) < 20)) {
          addAnnotation(snapshot, snapshot.score);
        }
        nextMilestoneIndex++;
      }
    }

    return annotations;
  }

  // Given snapshots, return a list of tuples (lines, trt) for each snapshot
  // Set trt of all lines < 14 to the snapshot with as close to 14 lines as possible
  private getGraphPoints(): [number, number][] {

    // First, get raw points
    const points: [number, number][] = [];
    for (let i = 0; i < this.history.length(); i++) {
      const snapshot = this.history.getSnapshot(i);
      const lines = snapshot.lines;
      const trt = snapshot.tetrisRate;

      points.push([lines, trt]);
    }

    if (points.length === 1) points.push([1, 0]);

    // make deep copy of points
    const pointsCopy = JSON.parse(JSON.stringify(points));

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

    return points;
  }

  // given points in form (lines, trt), return a string for a polyline converted into (x, y) coordinates
  private polylinePoints(points: [number, number][], interpolate: boolean): [number, number][] {

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
        coordinates = coordinates.filter((_, i) => (i % 3 === 0 || i === coordinates.length - 1));
      }

      const resolution = Math.ceil(500 / coordinates.length);
      coordinates = this.smoothPath(coordinates, resolution, 0.4);
    }
    
    // Finally, onvert coordinates to a string
    return coordinates;
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

  getXFromLines(lines: number) {
    return this.WIDTH * (lines / this.TOTAL_LINES);
  }

  onMouseMove(event: MouseEvent): void {
    const x = event.clientX - this.svgRect$.getValue()!.left;
    this.mouseX$.next(x);
  }

  onMouseLeave(): void {
    this.mouseX$.next(null);
  }

  private getPlacementFromX(x: number): number {

    // Find closest snapshot before and after x
    let i = 0;
    while (i < this.history.length() && this.getXFromLines(this.history.getSnapshot(i).lines) < x) {
      i++;
    }

    // If out of bounds, return the last placement
    if (i === this.history.length()) return this.history.getSnapshot(i - 1).placement;

    // If x is exactly at a snapshot, return that placement
    if (this.getXFromLines(this.history.getSnapshot(i).lines) === x) return this.history.getSnapshot(i).placement;

    // Otherwise, interpolate between the two closest snapshots
    const snapshot1 = this.history.getSnapshot(i - 1);
    const snapshot2 = this.history.getSnapshot(i);
    const x1 = this.getXFromLines(snapshot1.lines);
    const x2 = this.getXFromLines(snapshot2.lines);
    const placement1 = snapshot1.placement;
    const placement2 = snapshot2.placement;
    return Math.floor(placement1 + (placement2 - placement1) * ((x - x1) / (x2 - x1)));
  }


  onClick(event: MouseEvent): void {
    const mouseX = event.clientX - this.svgRect$.getValue()!.left;

    this.clickPlacement.emit(this.getPlacementFromX(mouseX));
  }

  getHoverY(mouseX: number): number {

    // interpolate between the two closest points to get the y value
    const points = this.points;
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i - 1];
      const [x2, y2] = points[i];
      if (x1 <= mouseX && mouseX <= x2) {
        const t = (mouseX - x1) / (x2 - x1);
        return y1 + t * (y2 - y1);
      }
    }
    return 0;
  }

  getScoreAtX(x: number): number {
    const lines = x / this.WIDTH * this.TOTAL_LINES;
    const snapshot = this.history.getSnapshotAtLines(lines);
    if (!snapshot) return 0;
    return snapshot.score;
  }

  condenseScore(score: number): string {
    if (score < 1000000) return `${Math.floor(score / 1000)}k`;
    return `${Math.floor(score / 10000) / 100}m`
  }


  getAnnotations(mouseX: number | null): Annotation[] {
    if (mouseX === null) return this.annotations;
    return [...this.annotations, {
      text: this.condenseScore(this.getScoreAtX(mouseX)),
      x: mouseX,
      y: this.getHoverY(mouseX),
      lines: -1 // doesn't matter
    }];
  }

  // Return an array of lines at which to add a label for x = line in lines 
  getLineLabels(): number[] {

    let interval: number; // interval between labels
    if (this.TOTAL_LINES < 40) interval = 10;
    else if (this.TOTAL_LINES < 110) interval = 20;
    else interval = 50;

    const labels: number[] = [];
    for (let i = 0; i <= this.TOTAL_LINES; i += interval) {
      labels.push(i);
    }

    return labels;
  }
}
