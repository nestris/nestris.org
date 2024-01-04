/*
 A board is represented by a 20x10 grid of cells. A cell can be empty or be filled with one of two color types.
 We can efficiently encode this in 400 bits (20 rows * 10 columns * 2 bits per cell).
*/
export enum ColorType {
    EMPTY = 0,
    PRIMARY = 1,
    SECONDARY = 2,
    WHITE = 3
}

export class TetrisBoard {

    // 20 rows, 10 columns
    private grid: ColorType[][] = [];

    // initialize the grid to be empty
    constructor() {
        for (let i = 0; i < 20; i++) {
            this.grid.push([]);
            for (let j = 0; j < 10; j++) {
                this.grid[i].push(ColorType.EMPTY);
            }
        }
    }

    // given a string of 400 bits, return a ColorGrid
    static fromBinaryString(binaryString: string): TetrisBoard {

        const grid = new TetrisBoard();

        let index = 0;
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                const colorType = parseInt(binaryString[index++]) as ColorType;
                grid.setAt(i, j, colorType);
            }
        }

        return grid;
    }

    // set the color of a cell at a given row and column
    setAt(row: number, column: number, color: ColorType): void {
        this.grid[row][column] = color;
    }

    // get the color of a cell at a given row and column
    getAt(row: number, column: number): ColorType {
        return this.grid[row][column];
    }

    // make a copy of the grid
    copy(): TetrisBoard {
        const grid = new TetrisBoard();

        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                grid.setAt(i, j, this.getAt(i, j));
            }
        }

        return grid;
    }

    // return a string of 400 bits
    toBinaryString(): string {
        let binaryString = '';

        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                binaryString += this.grid[i][j];
            }
        }

        return binaryString;
    }

}