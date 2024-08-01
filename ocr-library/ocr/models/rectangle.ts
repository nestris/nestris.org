import { Point } from "shared/tetris/point";

export type Rectangle = {
    top: number;
    bottom: number;
    left: number;
    right: number;
};

/**
 * At value = 0, returns min. At value = 1, returns max. In between, scales linearly.
 */
export function scaleValueWithinRange(value: number, min: number, max: number, round: boolean = false): number {
    const scaledValue = min + value * (max - min);
    if (round) return Math.round(scaledValue);
    return scaledValue;
}

/**
 * Scales a point from the unit rectangle to the given rectangle.
 */
export function scalePointWithinRect(rect: Rectangle, point: Point, round: boolean = false): Point {
    return {
        x: scaleValueWithinRange(point.x, rect.left, rect.right, round),
        y: scaleValueWithinRange(point.y, rect.top, rect.bottom, round)
    };
}