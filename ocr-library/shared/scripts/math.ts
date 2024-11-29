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