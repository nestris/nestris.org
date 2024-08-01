import { Calibration } from "../models/calibration";
import { Frame } from "../models/frame";
import { FloodFill } from "../util/floodfill";
import { Point } from "../../shared/tetris/point";

/**
 * Given a frame and a point, calibrate all the bounding rectangles for all the OCR elements.
 * 
 * @param frame The frame to use for calibration
 * @param frameIndex The index of the provided calibration frame in the video
 * @param point The point to start the main board floodfill from
 */
export function calibrate(frame: Frame, frameIndex: number, point: Point): Calibration {

    // Floodfill at the given point to derive the main board
    const boardRect = FloodFill.fromFrame(frame, point).getBoundingRect();
    if (!boardRect) throw new Error("Could not floodfill main board");

    const NEXTBOX_LOCATIONS: Point[] = [
        {x: 1.5, y: 0.41}, // top of the next box
        {x: 1.5, y: 0.595} // bottom of the next box
    ];
    const nextRect = FloodFill.fromRelativeRect(frame, boardRect, NEXTBOX_LOCATIONS).getBoundingRect();
    if (!nextRect) throw new Error("Could not floodfill next box");

    return {
        frameIndex,
        floodfillPoint: point,
        rects: {
            board: boardRect,
            next: nextRect
        }
    };

}