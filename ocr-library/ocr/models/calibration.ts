import { Point } from "shared/tetris/point";
import { Rectangle } from "./rectangle";

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