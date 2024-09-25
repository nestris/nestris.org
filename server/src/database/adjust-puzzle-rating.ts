import { Request, Response } from "express";
import { queryDB } from ".";
import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";

interface PuzzleRatedAttempt {
    player_elo: number;    // This corresponds to elo_before
    is_correct: boolean;
  }

// Helper function to calculate percentiles
function percentile(data: number[], percentile: number): number {
  const index = (percentile / 100) * (data.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= data.length) return data[lower];
  return data[lower] * (1 - weight) + data[upper] * weight;
}

// Function to get x values in the 25th to 75th percentile range
function getPercentileRange(data: number[]): number[] {
  const lower = percentile(data, 25);
  const upper = percentile(data, 75);
  return data.filter(x => x >= lower && x <= upper);
}

// Helper function to calculate the average
function average(data: number[]): number {
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

// Main function that takes in the data
function calculateAverages(data: PuzzleRatedAttempt[]): { averageTrue: number, averageFalse: number, countTrue: number, countFalse: number } {
  // Sort data by x values
  data.sort((a, b) => a.player_elo - b.player_elo);

  // Filter x values by y=true and y=false
  const xTrue = data.filter(d => d.is_correct).map(d => d.player_elo);
  const xFalse = data.filter(d => !d.is_correct).map(d => d.player_elo);

  // Get x values between 25th and 75th percentile for true and false
  const xTrueInRange = getPercentileRange(xTrue);
  const xFalseInRange = getPercentileRange(xFalse);

  console.log(`xTrueInRange: ${xTrueInRange}`);
  console.log(`xFalseInRange: ${xFalseInRange}`);

  // Calculate averages
  const averageTrue = average(xTrueInRange);
  const averageFalse = average(xFalseInRange);

  return {
      averageTrue,
      averageFalse,
      countTrue: xTrue.length,
      countFalse: xFalse.length
  };
}

export function predictElo(data: PuzzleRatedAttempt[]): number {
  // Call the function with the data
  const result = calculateAverages(data);

  // Calculate weighted average
  const totalCount = result.countTrue + result.countFalse;
  let weightedAverage = (result.averageTrue * result.countTrue + result.averageFalse * result.countFalse) / totalCount;

  // Rating should be at least the average of the 75th percentile of the false values
  if (weightedAverage < result.averageFalse) weightedAverage = result.averageFalse;

  return Math.round(weightedAverage);
}

async function getPuzzleAttempts(puzzleId: string): Promise<PuzzleRatedAttempt[]> {
    const query = `
      SELECT 
        elo_before AS player_elo,
        is_correct
      FROM 
        puzzle_attempts
      WHERE 
        puzzle_id = $1
      ORDER BY 
        elo_before ASC;
    `;
  
    // Execute the query with the provided puzzleId
    const result = await queryDB(query, [puzzleId]);
  
    // Check if there are any rows returned
    if (result.rows.length === 0) {
      return []; // Return an empty array if no puzzle attempts are found
    }
  
    // Return the result rows, which will be automatically cast to PuzzleAttempt[]
    return result.rows as PuzzleRatedAttempt[];
}

// Get the adjusted puzzle elo based on previous attempts, or null if insufficient data
export async function getAdjustedPuzzleElo(puzzleId: string): Promise<number | null> {

  // Minimum number of attempts required to predict elo
  const MINIMUM_ATTEMPTS = 10;

  const puzzleAttempts = await getPuzzleAttempts(puzzleId);
  
  if (puzzleAttempts.length < MINIMUM_ATTEMPTS) {
      return null;
  }

  const elo = predictElo(puzzleAttempts);

  return elo;
}

// Get the adjusted puzzle rating based on previous attempts, or null if insufficient data
export async function getAdustedPuzzleRating(puzzleId: string): Promise<PuzzleRating | null> {

  // Get the adjusted puzzle elo
  const elo = await getAdjustedPuzzleElo(puzzleId);
  if (elo === null) return null;

  // Return the rating based on the elo
  if (elo < 1000) return PuzzleRating.ONE_STAR;
  if (elo < 1500) return PuzzleRating.TWO_STAR;
  if (elo < 2000) return PuzzleRating.THREE_STAR;
  if (elo < 2500) return PuzzleRating.FOUR_STAR;
  return PuzzleRating.FIVE_STAR;
}

export async function getAdjustedPuzzleRatingRoute(req: Request, res: Response) {
    const puzzleId = req.params['puzzleId'];

    try {
        const rating = await getAdustedPuzzleRating(puzzleId);
        res.json({ rating });
    } catch (err) {
        res.status(500).json({ error: err });
    }
}