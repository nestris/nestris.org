import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';

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

interface TetrisBlock {
  shape: number[][];
  color: string;
  x: number;
  y: number;
  angle: number;
  rotationSpeed: number;
  speed: number;
  direction: number;
  size: number;
  enteredScreen: boolean;
  markForDelete: boolean;
}

@Component({
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.scss']
})
export class LoadingScreenComponent {
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @Input() blockSize: number = 25;
  @Input() scaleCircles: number = 1;
  @Input() blockSpeed: number = 1;
  @Input() maxBlocks: number = 50;
  @Input() resolution: number = 1;
  @Output() score = new EventEmitter<number>();

  readonly CIRCLE_PERSISTENCE = 200;
  readonly NUM_CIRCLES = 30;
  readonly CIRCLE_SPEED = 0.7;
  readonly MOUSE_POSITIONS_TO_TRACK = 5;
  readonly LINE_PERSISTENCE = 40;
  readonly TETRIS_BLOCK_SPAWN_INTERVAL = 300; // ms

  private canvas!: HTMLCanvasElement;
  private c!: CanvasRenderingContext2D;
  private circleArray: Circle[] = [];
  private lineArray: Line[] = [];
  private tetrisBlocks: TetrisBlock[] = [];
  private frame = 0;
  private mousePositions: MousePosition[] = [];

  private totalScore: number = 0;

  private readonly tetrisShapes = [
    [[1, 1, 1, 1]],  // I
    [[1, 1], [1, 1]],  // O
    [[1, 1, 1], [0, 1, 0]],  // T
    [[1, 1, 1], [1, 0, 0]],  // L
    [[1, 1, 1], [0, 0, 1]],  // J
    [[1, 1, 0], [0, 1, 1]],  // S
    [[0, 1, 1], [1, 1, 0]]   // Z
  ];

  private readonly tetrisColors = ['88, 215, 116', '197, 88, 215', '215, 141, 88', '215, 88, 90', '88, 215, 210', '166, 215, 88', '119, 88, 215'];


  changeScore(delta: number) {
    this.totalScore += delta;

    // make sure score is not negative
    this.totalScore = Math.max(0, this.totalScore);

    this.score.emit(Math.round(this.totalScore));
  }

  ngOnInit() {
    this.initCanvas();
    setInterval(() => this.spawnTetrisBlock(), this.TETRIS_BLOCK_SPAWN_INTERVAL);
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

    const rect = this.canvas.getBoundingClientRect();

    const mouseX = (event.clientX - rect.left) * this.resolution;
    const mouseY = (event.clientY - rect.top) * this.resolution;

    this.updateMousePosition(mouseX, mouseY);
    this.drawCircles();
    this.drawLine();

    this.checkTetrisBlockMouseover(mouseX, mouseY);

    this.changeScore(-0.1);
  }

  private updateMousePosition(x: number, y: number) {
    this.mousePositions.push({ x, y, timestamp: Date.now() });
    if (this.mousePositions.length > this.MOUSE_POSITIONS_TO_TRACK) {
      this.mousePositions.shift();
    }
  }

  private resizeCanvas() {
    this.canvas.width = this.canvas.getBoundingClientRect().width * this.resolution;
    this.canvas.height = this.canvas.getBoundingClientRect().height * this.resolution;
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
    const { vx, vy } = this.calculateMouseVelocity();
    const direction = Math.atan2(vy, vx);

    for (let i = 0; i < this.NUM_CIRCLES; i++) {
      const radius = Math.random() * 0.5 + 0.5;
      
      // Add some randomness to the direction and speed
      const randomAngle = direction + Math.pow(Math.random()*2 - 1, 7) * Math.PI + Math.PI;

      const circleVx = Math.cos(randomAngle) * this.CIRCLE_SPEED; // Scale down the speed
      const circleVy = Math.sin(randomAngle) * this.CIRCLE_SPEED; // Scale down the speed

      const spawnFrame = this.frame;
      const rgb = '255, 255, 255';
      const latestPosition = this.mousePositions[this.mousePositions.length - 1];
      
      this.circleArray.push(
        new Circle(latestPosition.x, latestPosition.y, radius * this.scaleCircles, circleVx, circleVy, rgb, 1, spawnFrame, this.CIRCLE_PERSISTENCE)
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

  private spawnTetrisBlock() {
    if (this.tetrisBlocks.length < this.maxBlocks) {
      const index = Math.floor(Math.random() * this.tetrisShapes.length);
      const shape = this.tetrisShapes[index];
      const color = this.tetrisColors[index];
      
      // Pick a random start side (0 = top, 1 = right, 2 = bottom, 3 = left)
      const startSide = Math.floor(Math.random() * 4);
      
      // Coordinates for block spawn location
      let x = 0, y = 0;
  
      // Set start position just outside the canvas based on the side
      switch (startSide) {
        case 0: // top
          x = Math.random() * this.canvas.width;
          y = -20; // above the canvas
          break;
        case 1: // right
          x = this.canvas.width + 20; // right side outside
          y = Math.random() * this.canvas.height;
          break;
        case 2: // bottom
          x = Math.random() * this.canvas.width;
          y = this.canvas.height + 20; // below the canvas
          break;
        case 3: // left
          x = -20; // left side outside
          y = Math.random() * this.canvas.height;
          break;
      }
  
      // Pick an opposite side for the target direction (ensures it's crossing the screen)
      const endSide = (startSide + 2) % 4;
      let targetX = 0, targetY = 0;
  
      // Set a random point on the opposite side for direction
      switch (endSide) {
        case 0: // top
          targetX = Math.random() * this.canvas.width;
          targetY = -20;
          break;
        case 1: // right
          targetX = this.canvas.width + 20;
          targetY = Math.random() * this.canvas.height;
          break;
        case 2: // bottom
          targetX = Math.random() * this.canvas.width;
          targetY = this.canvas.height + 20;
          break;
        case 3: // left
          targetX = -20;
          targetY = Math.random() * this.canvas.height;
          break;
      }
  
      // Calculate direction in radians from start to target
      const direction = Math.atan2(targetY - y, targetX - x);
  
      const block: TetrisBlock = {
        shape,
        color,
        x,  // Starting position outside canvas
        y,
        angle: 0,
        rotationSpeed: ((Math.random() - 0.5) * 0.1),
        speed: (Math.random() * 2 + 0.5) * this.blockSpeed,
        direction,  // Calculated direction towards the target
        size: this.blockSize,
        enteredScreen: false,
        markForDelete: false
      };
      
      this.tetrisBlocks.push(block);
    }
  }

  private updateTetrisBlocks() {
    this.tetrisBlocks.forEach(block => {
      block.x += Math.cos(block.direction) * block.speed;
      block.y += Math.sin(block.direction) * block.speed;
      block.angle += block.rotationSpeed;

      const outOfBounds = block.x < 0 || block.x > this.canvas.width || block.y < 0 || block.y > this.canvas.height;

      // block has entered the screen
      if (!block.enteredScreen && !outOfBounds) {
        block.enteredScreen = true;
      }

      // Mark for deletion if went out of bounds
      if (outOfBounds && block.enteredScreen) {
        block.markForDelete = true;
        this.changeScore(-20);
      }
    });

    // Remove blocks that are out of bounds
    this.tetrisBlocks = this.tetrisBlocks.filter(block => !block.markForDelete);
  }

  private drawTetrisBlocks() {
    this.tetrisBlocks.forEach(block => {
      this.c.save();
      this.c.translate(block.x, block.y);
      this.c.rotate(block.angle);

      this.c.fillStyle = `rgba(${block.color}, 0.3)`;

      this.c.strokeStyle = 'rgba(0, 0, 0, 0)';

      for (let row = 0; row < block.shape.length; row++) {
        for (let col = 0; col < block.shape[row].length; col++) {
          if (block.shape[row][col]) {
            this.c.fillRect(
              (col - block.shape[row].length / 2) * block.size,
              (row - block.shape.length / 2) * block.size,
              block.size - 1,
              block.size - 1
            );
          }
        }
      }
      this.c.restore();
    });
  }

  private checkTetrisBlockMouseover(x: number, y: number) {
    this.tetrisBlocks = this.tetrisBlocks.filter(block => {
      const dx = x - block.x;
      const dy = y - block.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < block.size * 2) {
        this.explodeTetrisBlock(block);
        return false;
      }
      return true;
    });
  }

  private explodeTetrisBlock(block: TetrisBlock) {

    this.changeScore(10);

    const blockCenterX = block.x;
    const blockCenterY = block.y;

    for (let row = 0; row < block.shape.length; row++) {
      for (let col = 0; col < block.shape[row].length; col++) {
        if (block.shape[row][col]) {
          const xOffset = (col - block.shape[row].length / 2) * block.size;
          const yOffset = (row - block.shape.length / 2) * block.size;

          // account for rotation
          block.angle += block.rotationSpeed; // rotate a bit more
          const rotatedX = xOffset * Math.cos(block.angle) - yOffset * Math.sin(block.angle);
          const rotatedY = xOffset * Math.sin(block.angle) + yOffset * Math.cos(block.angle);

          const individualBlockX = blockCenterX + rotatedX;
          const individualBlockY = blockCenterY + rotatedY;
          
          //const individualBlockX = blockCenterX + xOffset;
          //const individualBlockY = blockCenterY + yOffset;

          // Create particles for each individual block
          for (let i = 0; i < 50; i++) { // Reduced number of particles per block
            this.circleArray.push(
              new Circle(
                individualBlockX + (Math.random() - 0.5) * block.size,
                individualBlockY + (Math.random() - 0.5) * block.size,
                (Math.random() + 0.5) * this.scaleCircles,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                block.color,
                0.3,
                this.frame,
                100
              )
            );
          }
        }
      }
    }
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

    // Update and draw Tetris blocks
    this.updateTetrisBlocks();
    this.drawTetrisBlocks();
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