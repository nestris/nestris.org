import { Frame } from "./frame";
import { Rectangle, scalePointWithinRect } from "./rectangle";
import { Point } from "../../shared/tetris/point";
import { RGBColor } from "../../shared/tetris/tetromino-colors";

export class FloodFill {

    private width: number;
    private height: number;
    private filled: boolean[][];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.filled = Array.from({ length: height }, () => Array(width).fill(false));
    }

    static fromFrame(frame: Frame, point: Point): FloodFill {
        const floodfill = new FloodFill(frame.width, frame.height);
        floodfill.floodfill(frame, point);
        return floodfill;
    }

    /**
     * Use an existing rect and a relative point(s) to calculate the new floodfill point(s)
     * @param frame 
     * @param rect 
     * @param relativePoint 
     */
    static fromRelativeRect(frame: Frame, rect: Rectangle, relativePoint: Point | Point[]): FloodFill {
        
        // convert to array if not already
        const points = Array.isArray(relativePoint) ? relativePoint : [relativePoint];
        const floodfillPoints = points.map(point => scalePointWithinRect(rect, point, true));

        // create a new floodfill object and floodfill at the points
        const floodfill = new FloodFill(frame.width, frame.height);
        floodfillPoints.forEach(point => floodfill.floodfill(frame, point));
        return floodfill;
    }

    private isSimilar(colorA: RGBColor, colorB: RGBColor): boolean {
        return Math.abs(colorA.r - colorB.r) < 30 &&
            Math.abs(colorA.g - colorB.g) < 30 &&
            Math.abs(colorA.b - colorB.b) < 30;
    }

    // floodfill from a given point. Does not reset the filled matrix, so that you can
    // floodfill multiple times from different points
    public floodfill(
        frame: Frame,
        point: Point
    ): void {

        const startColor = frame.getPixelAt(point);
        console.log("startColor", startColor);
        if (!startColor) return;
    
        const stack: Point[] = [];
        stack.push(point);
    
        while (stack.length) {
            const { x, y } = stack.pop()!;
            const currentColor = frame.getPixelAt({ x, y });

            if (
                currentColor &&
                !this.filled[y][x] &&
                this.isSimilar(startColor, currentColor)
            ) {
                this.filled[y][x] = true;
                const neighbors = [
                    { x: x + 1, y },     // Right
                    { x: x - 1, y },     // Left
                    { x, y: y + 1 },     // Down
                    { x, y: y - 1 },     // Up
                    { x: x + 1, y: y + 1 }, // Bottom right diagonal
                    { x: x - 1, y: y + 1 }, // Bottom left diagonal
                    { x: x + 1, y: y - 1 }, // Top right diagonal
                    { x: x - 1, y: y - 1 }  // Top left diagonal
                ];
    
                for (const neighbor of neighbors) {
                    if (
                        neighbor.x >= 0 && neighbor.x < this.width &&
                        neighbor.y >= 0 && neighbor.y < this.height
                    ) {
                        stack.push(neighbor);
                    }
                }
            }
        }
    }

    // get the resultant bounding rect after floodfilling
    public getBoundingRect(): Rectangle | undefined {

        const matrix = this.filled;

        let minY = matrix.length;
        let maxY = -1;
        let minX = matrix[0]?.length || 0;
        let maxX = -1;
    
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x]) {
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                }
            }
        }
    
        if (minY <= maxY && minX <= maxX) {
            return {
                top: minY,
                bottom: maxY,
                left: minX,
                right: maxX
            };
        }
    
        return undefined; // No true values found in the matrix
    }
    
}
