/*
Global nestris.org competency levels
*/
export enum Difficulty {
  CORE = "CORE",
  NOVICE = "NOVICE",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export const DIFFICULTY_COLORS: { [key in Difficulty]: string } = {
  [Difficulty.CORE]: "#58D774",
  [Difficulty.NOVICE]: "#5874D7",
  [Difficulty.INTERMEDIATE]: "#D76758",
  [Difficulty.ADVANCED]: "#9F58D7",
}