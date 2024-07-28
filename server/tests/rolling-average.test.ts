import { RollingAverage, RollingAverageStrategy } from "../shared/scripts/rolling-average";

test('Test RollingAverage', () => {

    const averageDelta = new RollingAverage(3, RollingAverageStrategy.DELTA);
    const averageAbsolute = new RollingAverage(3, RollingAverageStrategy.ABSOLUTE);

    for (let average of [averageDelta, averageAbsolute]) {
        average.push(1); // [1]
        expect(average.get()).toBe(1);
        expect(average.getValues()).toEqual([1,]);

        average.push(2); // [1, 2]
        expect(average.get()).toBe(1.5);
        expect(average.getValues()).toEqual([1, 2]);

        average.push(3); // [1, 2, 3]
        expect(average.get()).toBe(2);
        expect(average.getValues()).toEqual([1, 2, 3]);

        average.push(4); // [4, 2, 3]
        expect(average.get()).toBe(3);
        expect(average.getValues()).toEqual([4, 2, 3]);

        average.push(5); // [4, 5, 3]
        expect(average.get()).toBe(4);
        expect(average.getValues()).toEqual([4, 5, 3]);

        average.push(6); // [4, 5, 6]
        expect(average.get()).toBe(5);
        expect(average.getValues()).toEqual([4, 5, 6]);
    }

});