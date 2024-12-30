import { DBPuzzleBuilder, NUM_DB_PUZZLE_BUILDER_PARAMS } from '../../shared/puzzles/db-puzzle';
import { queryDB } from './database';

export async function addPuzzlesToDatabase(puzzles: DBPuzzleBuilder[]): Promise<void> {

  try {

    const insertQuery = `
    INSERT INTO public.rated_puzzles (
        id,
        current_1, next_1, score_1,
        current_2, next_2, score_2,
        current_3, next_3, score_3,
        current_4, next_4, score_4,
        current_5, next_5, score_5,
        rating, theme
    )
    VALUES 
        ${puzzles.map((_, index) => {
        // Generate placeholders for each puzzle row
        return `(${Array.from({ length: NUM_DB_PUZZLE_BUILDER_PARAMS }, (_, i) => `$${index * NUM_DB_PUZZLE_BUILDER_PARAMS + i + 1}`).join(', ')})`;
        }).join(',')}
    `;

    // Map the puzzles to a flat array of values for insertion
    const values = puzzles.flatMap(puzzle => [
      puzzle.id,
      puzzle.current_1,
      puzzle.next_1,
      puzzle.score_1,
      puzzle.current_2,
      puzzle.next_2,
      puzzle.score_2,
      puzzle.current_3,
      puzzle.next_3,
      puzzle.score_3,
      puzzle.current_4,
      puzzle.next_4,
      puzzle.score_4,
      puzzle.current_5,
      puzzle.next_5,
      puzzle.score_5,
      puzzle.rating,
      puzzle.theme,
    ]);

    // Execute the query
    const startTime = Date.now();
    await queryDB(insertQuery, values);
    console.log(`${puzzles.length} puzzles inserted successfully in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('Error inserting puzzles:', err);
  }
}
