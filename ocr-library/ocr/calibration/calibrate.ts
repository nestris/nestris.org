import { Calibration, CalibrationPlus } from "../models/calibration";
import { Frame } from "../models/frame";
import { FloodFill } from "../util/floodfill";
import { Point } from "../../shared/tetris/point";
import { BoardOCRBox } from "./board-ocr-box";

/**
 * Given a frame and a point, calibrate all the bounding rectangles for all the OCR elements.
 * 
 * @param frame The frame to use for calibration
 * @param frameIndex The index of the provided calibration frame in the video
 * @param point The point to start the main board floodfill from
 */
export function calibrate(frame: Frame, frameIndex: number, point: Point): [Calibration, CalibrationPlus] {

    // Floodfill at the given point to derive the main board
    const boardRect = FloodFill.fromFrame(frame, point).getBoundingRect();
    if (!boardRect) throw new Error("Could not floodfill main board");
    const boardOCR = new BoardOCRBox(boardRect);

    // Use the main board rect to derive floodfill points and thus bounding rect for the next box
    const NEXTBOX_LOCATIONS: Point[] = [
        {x: 1.5, y: 0.41}, // top of the next box
        {x: 1.5, y: 0.595} // bottom of the next box
    ];
    const nextRect = FloodFill.fromRelativeRect(frame, boardRect, NEXTBOX_LOCATIONS).getBoundingRect();
    if (!nextRect) throw new Error("Could not floodfill next box");

    const calibration: Calibration = {
        frameIndex,
        floodfillPoint: point,
        rects: {
            board: boardRect,
            next: nextRect
        }
    };

    const calibrationPlus: CalibrationPlus = {
        points: boardOCR.getPlusPoints(),
    };

    return [calibration, calibrationPlus];
}