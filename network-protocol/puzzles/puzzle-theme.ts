export enum PuzzleTheme {
  CLEAN = "CLEAN",
  OVERHANG = "OVERHANG", // when the initial board has an overhang, or either piece sets up an overhang
  BURN = "BURN", // taking a burn on an otherwise clean board
  DIG = "DIG", // (when there's a hole and burn), or the right well is filled
  SPIRE = "SPIRE", // when the average height of two adjacent columns is at least 4 greater than the columns on both sides
}