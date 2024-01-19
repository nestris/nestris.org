export enum BlockType {
    EMPTY = 0,
    FILLED = 1
}

export default class BinaryGrid {

    constructor(public blocks: BlockType[][] = [], width: number = 10, height: number = 20) {

        // If no blocks are provided, create an empty grid of width x height
        if (blocks.length === 0) {
            for (let y = 0; y < height; y++) {
                let row: BlockType[] = [];
                for (let x = 0; x < width; x++) {
                    row.push(BlockType.EMPTY);
                }
                blocks.push(row);
            }
        }
    }

    get width(): number {
        return this.blocks[0].length;
    }

    get height(): number {
        return this.blocks.length;
    }


    public setAt(x: number, y: number, value: BlockType) {
        if (x < 0) throw new Error(`x must be >= 0, got ${x}`);
        if (x >= this.width) throw new Error(`x must be < ${this.width}, got ${x}`);
        if (y < 0) throw new Error(`y must be >= 0, got ${y}`);
        if (y >= this.height) throw new Error(`y must be < ${this.height}, got ${y}`);
        this.blocks[y][x] = value;
    }

    public exists(x: number, y: number): boolean {
        if (x < 0 || x >= this.width) return false;
        if (y < 0 || y >= this.height) return false;
        return this.blocks[y][x] === BlockType.FILLED;
    }
}