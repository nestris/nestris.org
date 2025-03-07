import { Calibration, CalibrationPlus } from "../util/calibration";
import { Frame } from "../util/frame";
import { FloodFill } from "../util/floodfill";
import { Point } from "../../shared/tetris/point";
import { BoardOCRBox } from "./board-ocr-box";
import { NextOCRBox } from "./next-ocr-box";
import { Rectangle, scalePointWithinRect } from "../util/rectangle";
import { NumberOCRBox } from "./number-ocr-box";

/**
 * Given a frame and a point, calibrate all the bounding rectangles for all the OCR elements.
 * 
 * @param frame The frame to use for calibration
 * @param frameIndex The index of the provided calibration frame in the video
 * @param point The point to start the main board floodfill from
 */
export function calibrate(frame: Frame, point: Point): [Calibration, CalibrationPlus] {

    // Floodfill at the given point to derive the main board
    const boardRect = FloodFill.fromFrame(frame, point).getBoundingRect();
    if (!boardRect) throw new Error("Could not floodfill main board");
    console.log("calibrated boardRect", boardRect);

    // Use the main board rect to derive floodfill points and thus bounding rect for the next box
    const NEXTBOX_LOCATIONS: Point[] = [
        {x: 1.5, y: 0.42}, // top of the next box
        {x: 1.5, y: 0.58} // bottom of the next box
    ];
    let nextRect = FloodFill.fromRelativeRect(frame, boardRect, NEXTBOX_LOCATIONS).getBoundingRect();
    if (!nextRect) {
        console.log("Could not floodfill next box");
        nextRect = {top: 0, bottom: 0, left: 0, right: 0 };
    }
    console.log("calibrated nextRect", nextRect);

    const LEVEL_LOCATION: Point = { x: 1.3, y: 0.78 };
    const levelRect = calibrateNumberBox(frame, boardRect,
        LEVEL_LOCATION,
        { left: 0.4, top: 0.48, right: 0.76, bottom: 0.86 }
    );
    console.log("calibrated levelRect", levelRect);


    const SCORE_LOCATION: Point = { x: 1.3, y: 0.18 };
    const scoreRect = calibrateNumberBox(frame, boardRect,
        SCORE_LOCATION,
        { left: 0.04, top: 0.68, right: 0.94, bottom: 0.82 },
    );
    console.log("calibrated scoreRect", scoreRect);


    const calibration: Calibration = {
        floodfillPoint: point,
        rects: {
            board: boardRect,
            next: nextRect,
            level: levelRect,
            score: scoreRect,
        }
    };

    const points = Object.assign({},
        (new BoardOCRBox(boardRect)).getPlusPoints(),
        { 
            next: (new NextOCRBox(nextRect)).getGridPoints().flat(),
            nextFloodfill: NEXTBOX_LOCATIONS.map(point => scalePointWithinRect(boardRect, point, true)),
            levelFloodfill: [ scalePointWithinRect(boardRect, LEVEL_LOCATION, true) ],
            scoreFloodfill: [ scalePointWithinRect(boardRect, SCORE_LOCATION, true) ],
        }
    )

    const calibrationPlus: CalibrationPlus = {
        points: points,
    };

    return [calibration, calibrationPlus];
}

function calibrateNumberBox(
    frame: Frame,
    boardRect: Rectangle,
    floodfillPoint: Point,
    numberRect: Rectangle,
): Rectangle {

    let rect = FloodFill.fromRelativeRect(frame, boardRect, floodfillPoint).getBoundingRect();
    if (!rect) rect = {top: 0, bottom: 0, left: 0, right: 0 };

    const topLeft = scalePointWithinRect(rect, {x: numberRect.left, y: numberRect.top}, true);
    const bottomRight = scalePointWithinRect(rect, {x: numberRect.right, y: numberRect.bottom}, true);
    return {top: topLeft.y, left: topLeft.x, bottom: bottomRight.y, right: bottomRight.x};
}