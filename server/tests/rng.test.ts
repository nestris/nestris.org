import { GymRNG } from "../shared/tetris/piece-sequence-generation/gym-rng";
import { TetrominoType } from "../shared/tetris/tetromino-type";
import { TETROMINO_CHAR } from "../shared/tetris/tetrominos";


test('Test set seed RNG', () => {
    const seed = "04A825";
    const rng = new GymRNG(seed);
    expect(rng.getSeedString()).toBe(seed);
    expect(rng.getNextPiece()).toBe(TetrominoType.I_TYPE);
    expect(rng.getNextPiece()).toBe(TetrominoType.S_TYPE);
});

test('Test random seed RNG', () => {
    const rng = GymRNG.fromRandomSeed();
    console.log(rng.getSeedString());
})

test('Custom RNG', () => {

    const seed = "1ECC32";
    const rng = new GymRNG(seed);
    console.log(rng.getSeedString());
    expect(rng.getNextPiece()).toBe(TetrominoType.Z_TYPE);
});