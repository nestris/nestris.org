import { Rectangle, scalePointWithinRect } from "../util/rectangle";
import { Point } from "../../shared/tetris/point";

/**
 * Fetches all the relevant pixel coordinates for the nextbox relative to a given bounding box
 */
export class NextOCRBox {

    constructor(
        public readonly rect: Rectangle,
    ) {}

    /**
     * @returns The points the 8x4 grid of the next box, where each mino should contain 4 points at 
     * the four corners of the mino, so that all the points are evenly-spaced
     */
    getGridPoints(round: boolean = true): Point[][] {

        // Defines paddings as a percentage of the width/height of the next box
        const paddingLeft = 0.06;
        const paddingRight = 0.06;
        const paddingTop = 0.45;
        const paddingBottom = 0.28;

        const gridWidth = 8;
        const gridHeight = 4;

        const gridPoints: Point[][] = [];
        for (let y = 0; y < gridHeight; y++) {
            const row: Point[] = [];
            for (let x = 0; x < gridWidth; x++) {
                const relativePoint = {
                    x : (paddingLeft + (x / (gridWidth-1)) * (1 - paddingLeft - paddingRight)),
                    y : (paddingTop + (y / (gridHeight-1)) * (1 - paddingTop - paddingBottom))
                } 
                row.push(scalePointWithinRect(this.rect, relativePoint, round));
            }
            gridPoints.push(row);
        }

        return gridPoints;
    }

}