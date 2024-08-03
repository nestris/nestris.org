import { Point } from "shared/tetris/point";
import { Rectangle, scalePointWithinRect } from "../util/rectangle";

test("unit-rectangle", () => {
    const rect: Rectangle = {
        top: 100,
        bottom: 200,
        left: 300,
        right: 500,
    };

    const point: Point = {x: 1.5, y: 0.5};
    const scaledPoint = scalePointWithinRect(rect, point);
    expect(scaledPoint).toEqual({x: 600, y: 150});
});