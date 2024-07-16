/*
Stores a rectangle dimensions, and the specifications of the matrix within the rectangle
to OCR
*/

import { RGBGrid } from "./rgb-grid";
import { Pixels } from "./pixels";
import { Point } from "src/app/shared/tetris/point";

export type Rectangle = {
    top: number;
    bottom: number;
    left: number;
    right: number;
};


export class OCRPosition {
    constructor(
        public numRows: number, // how many OCR dots to read vertically
        public paddingTop: number, // distance (in percent of height) before first OCR dot row
        public paddingBottom: number, // distance (in percent of height) after last OCR dot row
        public numCols: number, // how many OCR dots to read horizontally
        public paddingLeft: number, // distance (in percent of width) before first OCR dot column
        public paddingRight: number, // distance (in percent of width) after last OCR dot column
    ) {}
}

export const BOARD_OCR_POSITION = new OCRPosition(
    20, 0.03, 0.032, // numRows, paddingTop, paddingBottom
    10, 0.05, 0.038, // numCols, paddingLeft, paddingRight
);

export const BOARD_SHINE_OCR_POSITION = new OCRPosition(
    20, 0.02, 0.042, // numRows, paddingTop, paddingBottom
    10, 0.03, 0.058, // numCols, paddingLeft, paddingRight
);

export const NEXT_OCR_POSITION = new OCRPosition(
    6, 0.37, 0.18, // numRows, paddingTop, paddingBottom
    8, 0.05, 0.04, // numCols, paddingLeft, paddingRight
)


export class OCRBox {

    // all the canvas positions of the OCR matrixs
    // each position is (x,y)
    // pos[y][x]
    private positions: Point[][];


    private readonly HEIGHT: number;
    public readonly START_Y: number;
    private readonly WIDTH: number;
    public readonly START_X: number;

    constructor(
        private readonly boundingRect: Rectangle,
        private readonly p: OCRPosition,
    ) {

        const boundingWidth = boundingRect.right - boundingRect.left;
        const boundingHeight = boundingRect.bottom - boundingRect.top;

        this.HEIGHT = boundingHeight * (1 - p.paddingTop - p.paddingBottom);
        this.START_Y = boundingRect.top + boundingHeight * p.paddingTop;

        this.WIDTH = boundingWidth * (1 - p.paddingLeft - p.paddingRight);
        this.START_X = boundingRect.left + boundingWidth * p.paddingLeft;

        this.positions = [];
        for (let yIndex = 0; yIndex < p.numRows; yIndex++) {
            let row: Point[] = [];

            const y = Math.floor(this.START_Y + this.HEIGHT * (yIndex / (p.numRows-1)));

            for (let xIndex = 0; xIndex < p.numCols; xIndex++) {
                const x = Math.floor(this.START_X + this.WIDTH * (xIndex / (p.numCols-1)));
                
                row.push({x, y});
            }
            this.positions.push(row);
        } 
        
    }

    public getBoundingRect(): Rectangle {
        return this.boundingRect;
    }

    public getPositions(): Point[][] {
        return this.positions;
    }

    // convert from relative percents of box width/height to absolute pixels on canvas
    public getCanvasPositionFromRelative(relativePosition: Point): Point {
        const x = Math.floor(this.START_X + this.WIDTH * relativePosition.x);
        const y = Math.floor(this.START_Y + this.HEIGHT * relativePosition.y);
        return {x, y};
    }

    public getVectorFromRelative(vector: Point): Point {
        const x = Math.floor(this.WIDTH * vector.x);
        const y = Math.floor(this.HEIGHT * vector.y);
        return {x, y};
    }

    // given an image, return the HSV values of the OCR matrix
    public evaluate(pixels: Pixels): RGBGrid {

        const grid = new RGBGrid(this.p.numCols, this.p.numRows);

        for (let yIndex = 0; yIndex < this.p.numRows; yIndex++) {

            for (let xIndex = 0; xIndex < this.p.numCols; xIndex++) {
                const {x, y} = this.positions[yIndex][xIndex];
                const rgb = pixels.getPixelAt(x, y);

                if (rgb) {
                    grid.setAt(xIndex, yIndex, rgb);
                } 
        
            }
        }

        return grid;
    }

}
