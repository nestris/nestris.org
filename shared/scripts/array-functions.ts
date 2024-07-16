export function contains(array: any[], value: any) {
    return array.find((v) => v === value) !== undefined;
}
