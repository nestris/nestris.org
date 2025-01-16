export function standardDeviation(data: number[]): number {
    if (data.length === 0) {
        throw new Error("Array must not be empty");
    }

    // Calculate the mean
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;

    // Calculate the variance
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;

    // Return the standard deviation (square root of variance)
    return Math.sqrt(variance);
}

export function truncatedMean(data: number[], trimPercent: number): number {
    if (trimPercent < 0 || trimPercent > 50) {
        throw new Error("trimPercent must be between 0 and 50.");
    }

    if (data.length === 0) {
        throw new Error("Data array must not be empty.");
    }

    // Sort the data array in ascending order
    const sortedData = [...data].sort((a, b) => a - b);

    // Calculate the number of elements to trim from each end
    const trimCount = Math.floor((trimPercent / 100) * sortedData.length);

    // Extract the truncated array
    const truncatedData = sortedData.slice(trimCount, sortedData.length - trimCount);

    if (truncatedData.length === 0) {
        throw new Error("Trimming too many elements results in an empty dataset.");
    }

    // Calculate the mean of the truncated array
    const sum = truncatedData.reduce((acc, value) => acc + value, 0);
    return sum / truncatedData.length;
}

// Returns a random integer between min (inclusive) and max (inclusive)
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice<T>(array: T[]): T {
    return array[randomInt(0, array.length - 1)];
}

export function weightedRandomChoice<T>(array: T[], weights: number[]): T {
    if (array.length !== weights.length) {
        throw new Error("Array and weights must have the same length.");
    }

    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    const randomValue = Math.random() * totalWeight;

    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += weights[i];
        if (randomValue < sum) {
            return array[i];
        }
    }

    return randomChoice(array);
}