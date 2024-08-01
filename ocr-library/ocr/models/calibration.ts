import { Point } from "shared/tetris/point";
import { Rectangle } from "./rectangle";
import { RGBColor } from "shared/tetris/tetromino-colors";

export interface Calibration {

    // The index of the frame that this calibration is for
    frameIndex: number;

    // The point that the floodfill started from
    floodfillPoint: Point;

    // All the bounding rectangles for the OCR elements
    rects: {
        board: Rectangle;
        next: Rectangle;
    }
    // TODO 
}

// Extra generated calibration data that is useful for debugging
export interface CalibrationPlus {

    // Each group represents a set of colored points to draw on the canvas
    points: {[group: string]: Point[]};
}