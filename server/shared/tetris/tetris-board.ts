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

export function getRandomColorType(): ColorType {
    return Math.floor(Math.random() * 3) + 1;
}

export class TetrisBoard {

    // 20 rows, 10 columns
    private grid: ColorType[][] = [];

    // initialize the grid to be empty
    constructor() {
        for (let y = 0; y < 20; y++) {
            this.grid.push([]);
            for (let x = 0; x < 10; x++) {
                this.grid[y].push(ColorType.EMPTY);
            }
        }
    }

    static random(): TetrisBoard {
        const board = new TetrisBoard();
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (Math.random() < 0.5) board.setAt(x, y, getRandomColorType());                
            }
        }
        return board;
    }

    // set the color of a cell at a given row and column
    setAt(x: number, y: number, color: ColorType): void {

        // fail silently if out of bounds
        if (x < 0 || x >= 10 || y < 0 || y >= 20) {
            return;
        }

        this.grid[y][x] = color;
    }

    // get the color of a cell at a given row and column
    getAt(x: number, y: number): ColorType {
        return this.grid[y][x];
    }

    // whether block at (x,y) exists
    exists(x: number, y: number): boolean {

        // out of bounds
        if (x < 0 || x >= 10 || y < 0 || y >= 20) {
            return false;
        }

        return this.getAt(x, y) != ColorType.EMPTY;
    }

    // count the number of tetrominos in the board
    count(): number {
        let count = 0;
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.exists(x,y)) count++;
            }
        }
        return count;
    }

    public isRowFull(y: number): boolean {
        return this.grid[y].every(cell => cell !== ColorType.EMPTY);
    }

    // modifies grid in place to delete line clears, and returns the number of lines cleared
    public processLineClears(): number {
        // remove all full rows
        let y = 19;
        let numLinesCleared = 0;
        while (y >= 0) {
            if (this.isRowFull(y)) {
                this.grid.splice(y, 1);
                numLinesCleared++;
            }
            y--;
        }

        // insert new empty rows at the top
        for (let i = 0; i < numLinesCleared; i++) {
            this.grid.unshift(new Array(10).fill(ColorType.EMPTY));
        }

        return numLinesCleared;
    }

    // make a copy of the grid
    copy(): TetrisBoard {
        const grid = new TetrisBoard();

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                grid.setAt(x, y, this.getAt(x, y));
            }
        }

        return grid;
    }

    equals(other: TetrisBoard): boolean {
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.getAt(x, y) !== other.getAt(x, y)) {
                    return false;
                }
            }
        }
        return true;
    }

    equalsIgnoreColor(other: TetrisBoard): boolean {
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.exists(x, y) !== other.exists(x, y)) {
                    return false;
                }
            }
        }
        return true;
    }

    // print 20x10 grid with the color numbers
    print() {
        let str = "";
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                str += "" + this.getAt(x,y) + " ";
            }
            str += "\n"
        }
        console.log(str);
    }

    // Generator to iterate through all cells in the grid
    *iterateMinos(): Generator<{x: number, y: number, color: ColorType}> {
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                yield { x, y, color: this.getAt(x, y) };
            }
        }
    }

    /**
     * Create a new board that is equal to board1 - board2. If the perfect flag is set, null will be returned
     * instead if a mino that exists on board2 does not exist on board1. Otherwise, a mino that exists on board2
     * subtracting from an empty cell on board1 will do nothing.
     * @param board1 The board to subtract from
     * @param board2 The board to subtract
     * @param perfect If true, return null if a mino that exists on board2 does not exist on board1
     * @returns A new board that is equal to board1 - board2
     */
    static subtract(board1: TetrisBoard, board2: TetrisBoard, perfect: boolean): TetrisBoard | null {
        const newBoard = new TetrisBoard();
        for (let { x, y, color } of board1.iterateMinos()) {
            const color2 = board2.getAt(x, y);
            if (color2 === ColorType.EMPTY) {
                newBoard.setAt(x, y, color);
            } else {
                if (color === ColorType.EMPTY) {
                    if (perfect) {
                        return null;
                    }
                } else {
                    newBoard.setAt(x, y, ColorType.EMPTY);
                }
            }
        }
        return newBoard;
    }

    /**
     * Get the list of all connected components on the board as a list of TetrisBoard objects. A connected
     * component is a group of cells that are connected to each other through vertical or horizontal adjacency.
     * @returns A list of TetrisBoard objects, each representing a connected component
     */
    extractAllConnectedComponents(): TetrisBoard[] {

        const visited = new Set<string>();
        const components: TetrisBoard[] = [];

        const isInBounds = (x: number, y: number): boolean => {
            return x >= 0 && x < 10 && y >= 0 && y < 20;
        };

        const getKey = (x: number, y: number): string => {
            return `${x},${y}`;
        };

        const directions = [
            { dx: 0, dy: 1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: -1, dy: 0 }
        ];

        const bfs = (startX: number, startY: number): TetrisBoard => {
            const queue: { x: number, y: number }[] = [{ x: startX, y: startY }];
            const component = new TetrisBoard();
            component.setAt(startX, startY, this.getAt(startX, startY));
            visited.add(getKey(startX, startY));

            while (queue.length > 0) {
                const { x, y } = queue.shift()!;
                for (const { dx, dy } of directions) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (isInBounds(newX, newY) && !visited.has(getKey(newX, newY)) && this.exists(newX, newY)) {
                        queue.push({ x: newX, y: newY });
                        visited.add(getKey(newX, newY));
                        component.setAt(newX, newY, this.getAt(newX, newY));
                    }
                }
            }

            return component;
        };

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.exists(x, y) && !visited.has(getKey(x, y))) {
                    const component = bfs(x, y);
                    components.push(component);
                }
            }
        }

        return components;
    }

    getAverageHeight(): number {
        let totalHeight = 0;
        const numColumns = 9; // ignore last column
        
        for (let x = 0; x < numColumns; x++) {
            for (let y = 0; y < 20; y++) {
                if (this.exists(x, y)) {
                    totalHeight += 20 - y;
                    break; // Move to the next column once we find the highest block
                }
            }
        }
        
        return totalHeight / numColumns;
    }

    isRightWellOpen(): boolean {
        for (let y = 0; y < 20; y++) {
            if (this.exists(9, y)) {
                return false;
            }
        }
        return true;
    }
}