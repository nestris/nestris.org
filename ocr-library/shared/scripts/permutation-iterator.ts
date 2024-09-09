export class PermutationIterator {
    private attributes: { name: string; values: number[] }[] = [];

    // Register an attribute with a range and step size
    register(name: string, min: number, max: number, step: number = 1): void {
        const values: number[] = [];
        for (let i = min; i <= max; i += step) {
            values.push(i);
        }
        this.attributes.push({ name, values });
    }

    // Generator function to iterate over all permutations
    *iterate() {
        const permutations = this.generatePermutations(0, {});

        for (const permutation of permutations) {
            yield permutation;
        }
    }

    // Helper function to generate permutations recursively
    private generatePermutations(index: number, current: any): any[] {
        if (index === this.attributes.length) {
            return [current];
        }

        const attribute = this.attributes[index];
        const result: any[] = [];

        for (const value of attribute.values) {
            const newCurrent = { ...current, [attribute.name]: value };
            result.push(...this.generatePermutations(index + 1, newCurrent));
        }

        return result;
    }
}

/* Usage example
const iterator = new PermutationIterator();
iterator.register("x", -2, 2); // x varies from -2 to 2
iterator.register("y", -4, 4, 2); // y varies from -4 to 4 with a step of 2

for (const { x, y } of iterator.iterate()) {
    console.log(`x: ${x}, y: ${y}`);
}
*/