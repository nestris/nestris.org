export enum PuzzleTheme {
  CLEAN = "CLEAN",
  OVERHANG = "OVERHANG", // when the initial board has an overhang, or either piece sets up an overhang
  BURN = "BURN", // taking a burn on an otherwise clean board
  DIG = "DIG", // when right well is covered at the start
  SPIRE = "SPIRE", // when the average height of two adjacent columns is at least 4 greater than the columns on both sides
}

export const PUZZLE_THEME_TEXT: { [key in PuzzleTheme]: string } = {
  [PuzzleTheme.CLEAN]: "Stacking",
  [PuzzleTheme.OVERHANG]: "Overhangs",
  [PuzzleTheme.BURN]: "Burns",
  [PuzzleTheme.DIG]: "Digging",
  [PuzzleTheme.SPIRE]: "Spires",
};