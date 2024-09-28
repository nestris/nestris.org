import { PuzzleRating } from "../../shared/puzzles/puzzle-rating";

function calculateProbabilities(elo: number): number[] {
  const minElo = 0;
  const maxElo = 4000;
  const normalizedElo = Math.min(Math.max(elo, minElo), maxElo) / maxElo;
  
  const oneStar = Math.max(0, 1 - normalizedElo * 3);
  const twoStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.3) * 3); 
  const threeStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.5) * 2.5); 
  const fourStar = Math.max(0, 1 - Math.abs(normalizedElo - 0.75) * 2);
  const fiveStar = Math.max(0, normalizedElo * 3 - 1.5);


  const total = oneStar + twoStar + threeStar + fourStar + fiveStar;
  return [oneStar, twoStar, threeStar, fourStar, fiveStar].map(p => p / total);
}

export function getRandomPuzzleRatingForPlayerElo(elo: number): PuzzleRating {
  const probabilities = calculateProbabilities(elo);
  const randomValue = Math.random();
  let cumulativeProbability = 0;

  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (randomValue <= cumulativeProbability) {
      return i + 1 as PuzzleRating;
    }
  }

  // This should never happen, but TypeScript needs a return statement
  return PuzzleRating.THREE_STAR;
}

// Helper function to test the distribution
function testDistribution(elo: number, iterations: number): void {

  // print the elo distribution neatly
  //const probabilities = calculateProbabilities(elo);
  //console.log(`ELO ${elo}:`, probabilities.map(p => (p * 100).toFixed(2) + '%'));
  //return;

  const counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < iterations; i++) {
    const rating = getRandomPuzzleRatingForPlayerElo(elo);
    counts[rating - 1]++;
  }
  console.log(`ELO ${elo}:`, counts.map(c => (c / iterations * 100).toFixed(2) + '%'));
}

export function test() {
    // Test the distribution
    for (let i = 0; i <= 4000; i += 100) {
        testDistribution(i, 10000);
    }
}