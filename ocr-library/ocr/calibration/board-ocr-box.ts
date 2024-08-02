import { Rectangle, scalePointWithinRect } from "../models/rectangle";
import { Point } from "../../shared/tetris/point";

export class BoardOCRBox {

    constructor(
        public readonly rect: Rectangle,
    ) {}

    /**
     * Given a point on the tetris board, returns the pixel coordinate at center of the mino at that point.
     * @param mino The coordinates of the mino on the board
     * @returns The pixel coordinate at the center of the mino
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

    /**
     * Given a point on the tetris board, returns the pixel coordinate at the top left of the block at that point.
     * That specific part of the block is the brightest and is used for block/no-block threshold detection.
     * @param mino The coordinates of the mino on the board
     * @returns The pixel coordinate at the "block shine" location of the mino
     */
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
     * Returns a list of points that should be pixel coordinates inside the mino at the given point. They should be
     * to the NE, SE, and SW of the center of the mino. Purpose of using multiple points is redundancy and smoothing
     * out pixel values, as well as looking at SD to help determine the validity of the entire board. High SD across
     * all minos in the board indicates that we are not looking at the board.
     * @param mino 
     * @returns 
     */
    getMinoPoints(mino: Point): Point[] {
        const center = this.getMinoCenter(mino);
        const radiusX = (this.rect.bottom - this.rect.top) / 92;
        const radiusY = (this.rect.bottom - this.rect.top) / 109;

        const offsets = [
            { x: radiusX, y: -radiusY }, // NE
            { x: radiusX, y: radiusY }, // SE
            { x: -radiusX, y: radiusY }, // SW
        ]

        return offsets.map(offset => ({
            x: Math.round(center.x + offset.x),
            y: Math.round(center.y + offset.y),
        }));
    }

    /**
     * @returns The mino center coordinates for every mino on the Tetris board
     */
    getPlusPoints(): {[group in string] : Point[]} {
        const centerPoints: Point[] = [];
        const shinePoints: Point[] = [];
        const minoPoints: Point[] = [];

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                centerPoints.push(this.getMinoCenter({x, y}, true));
                shinePoints.push(this.getBlockShine({x, y}));
                minoPoints.push(...this.getMinoPoints({x, y}));
            }
        }
        return { board: centerPoints, shine: shinePoints, mino: minoPoints };
    }
}