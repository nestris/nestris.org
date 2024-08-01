import { Rectangle, scalePointWithinRect } from "../models/rectangle";
import { Point } from "../../shared/tetris/point";

export class BoardOCRBox {

    constructor(
        public readonly rect: Rectangle,
    ) {}

    /**
     * Given a point on the tetris board, returns the pixel coordinate at center of the mino at that point.
     * @param mino The coordinates of the mino on the board
     * @returns 
     */
    getMinoCenter(mino: Point, round: boolean = false): Point {

        // Assert that the mino is a valid integer coordinate in the Tetris board
        if (!Number.isInteger(mino.x) || !Number.isInteger(mino.y)) {
            throw new Error(`Mino position must be an integer: ${mino.x}, ${mino.y}`);
        }
        if (mino.x < 0 || mino.x > 9 || mino.y < 0 || mino.y > 19) {
            throw new Error(`Invalid mino position: ${mino.x}, ${mino.y}`);
        }

        return scalePointWithinRect(this.rect, {
            x: (mino.x + 0.5) / 10,
            y: (mino.y + 0.5) / 20.15,
        }, round);
    }

    getBlockShine(mino: Point): Point {

        const radiusX = (this.rect.bottom - this.rect.top) / 80;
        const radiusY = (this.rect.bottom - this.rect.top) / 95;

        const center = this.getMinoCenter(mino);
        return {
            x: Math.round(center.x - radiusX),
            y: Math.round(center.y - radiusY),
        }
    }

    /**
     * @returns The mino center coordinates for every mino on the Tetris board
     */
    getPlusPoints(): {[group in string] : Point[]} {
        const centerPoints: Point[] = [];
        const shinePoints: Point[] = [];

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                centerPoints.push(this.getMinoCenter({x, y}, true));
                shinePoints.push(this.getBlockShine({x, y}));
            }
        }
        return { board: centerPoints, shine: shinePoints };
    }
}