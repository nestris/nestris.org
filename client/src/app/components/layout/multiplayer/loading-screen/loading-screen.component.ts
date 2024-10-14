import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

interface Line {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  opacity: number;
}

@Component({
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.scss']
})
export class LoadingScreenComponent {
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly CIRCLE_PERSISTENCE = 200;
  readonly NUM_CIRCLES = 20;
  readonly MOUSE_POSITIONS_TO_TRACK = 5;
  readonly LINE_PERSISTENCE = 30;

  private canvas!: HTMLCanvasElement;
  private c!: CanvasRenderingContext2D;
  private circleArray: Circle[] = [];
  private lineArray: Line[] = [];
  private frame = 0;
  private mousePositions: MousePosition[] = [];

  ngOnInit() {
    this.initCanvas();
  }

  ngAfterViewInit() {
    this.canvas = this.canvasElement.nativeElement;
    this.c = this.canvas.getContext('2d')!;
    this.resizeCanvas();
    this.animate();
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.updateMousePosition(event.clientX, event.clientY);
    this.drawCircles();
    this.drawLine();
  }


  private updateMousePosition(x: number, y: number) {
    this.mousePositions.push({ x, y, timestamp: Date.now() });
    if (this.mousePositions.length > this.MOUSE_POSITIONS_TO_TRACK) {
      this.mousePositions.shift();
    }
  }

  private resizeCanvas() {
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;
    this.initCanvas();
  }

  private initCanvas() {
    this.circleArray = [];
    this.lineArray = [];
  }

  private calculateMouseVelocity(): { vx: number, vy: number, speed: number } {
    if (this.mousePositions.length < 2) {
      return { vx: 0, vy: 0, speed: 0 };
    }

    const newest = this.mousePositions[this.mousePositions.length - 1];
    const oldest = this.mousePositions[0];

    const dx = newest.x - oldest.x;
    const dy = newest.y - oldest.y;
    const dt = (newest.timestamp - oldest.timestamp) / 1000; // Convert to seconds

    const vx = dx / dt;
    const vy = dy / dt;
    const speed = Math.sqrt(vx * vx + vy * vy);

    return { vx, vy, speed };
  }

  private drawCircles() {
    const { vx, vy, speed } = this.calculateMouseVelocity();
    const direction = Math.atan2(vy, vx);

    for (let i = 0; i < this.NUM_CIRCLES; i++) {
      const radius = Math.random() * 0.5 + 0.5;
      
      // Add some randomness to the direction and speed
      const randomAngle = direction + Math.pow(Math.random()*2 - 1, 4) * 2 * Math.PI + Math.PI;
      const speed = 1;

      const circleVx = Math.cos(randomAngle) * speed; // Scale down the speed
      const circleVy = Math.sin(randomAngle) * speed; // Scale down the speed

      const spawnFrame = this.frame;
      const rgb = '255, 255, 255';
      const latestPosition = this.mousePositions[this.mousePositions.length - 1];
      
      this.circleArray.push(
        new Circle(latestPosition.x, latestPosition.y, radius, circleVx, circleVy, rgb, 1, spawnFrame, this.CIRCLE_PERSISTENCE)
      );
    }
  }

  private drawLine() {
    if (this.mousePositions.length < 2) return;

    const newest = this.mousePositions[this.mousePositions.length - 1];
    const previous = this.mousePositions[this.mousePositions.length - 2];

    this.lineArray.push({
      startX: previous.x,
      startY: previous.y,
      endX: newest.x,
      endY: newest.y,
      opacity: 1
    });
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.frame += 1;
    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw circles
    for (const circle of this.circleArray) {
      circle.update(this.c, this.frame, this.canvas.width, this.canvas.height);
    }
    this.circleArray = this.circleArray.filter(circle => this.frame <= circle.birth + circle.life);

    // Update and draw lines
    for (const line of this.lineArray) {
      this.c.beginPath();
      this.c.moveTo(line.startX, line.startY);
      this.c.lineTo(line.endX, line.endY);
      this.c.strokeStyle = `rgba(255, 255, 255, ${line.opacity})`;
      this.c.stroke();
      line.opacity -= 1 / this.LINE_PERSISTENCE;
    }
    this.lineArray = this.lineArray.filter(line => line.opacity > 0);
  }
}

class Circle {
  constructor(
    public x: number,
    public y: number,
    public radius: number,
    public vx: number,
    public vy: number,
    public rgb: string,
    public opacity: number,
    public birth: number,
    public life: number
  ) {}

  draw(c: CanvasRenderingContext2D) {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = `rgba(${this.rgb},${this.opacity})`;
    c.fill();
  }

  update(c: CanvasRenderingContext2D, frame: number, width: number, height: number) {
    if (this.x + this.radius > width || this.x - this.radius < 0) {
      this.vx = -this.vx;
    }

    if (this.y + this.radius > height || this.y - this.radius < 0) {
      this.vy = -this.vy;
    }

    this.x += this.vx;
    this.y += this.vy;

    this.opacity = 1 - ((frame - this.birth) * 1) / this.life;

    this.draw(c);
  }
}