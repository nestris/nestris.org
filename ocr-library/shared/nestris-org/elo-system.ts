// https://www.desmos.com/calculator/253lft1lwd

/**
 * The expected value for the score (W=1, D=0.5, L=0) of a player against their opponent based on their Elo ratings.
 * @param playerElo The starting Elo rating of the player
 * @param opponentElo The starting Elo rating of the opponent
 * @returns The expected score of the player
 */
function expectedScore(playerElo: number, opponentElo: number) {
    const ELO_VARIANCE = 800;
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / ELO_VARIANCE));
}

/**
 * The elo K-factor for a player based on the number of matches they have played.
 * @param numMatches The number of matches the player has played
 * @returns The K-factor for the player
 */
function getKFactor(numMatches: number) {
    return 600 / (Math.pow(numMatches, 1.1) + 2.5) + 60;
}

/**
 * Get the change in Elo rating for a player after a match against an opponent given the player's score.
 * @param playerElo The elo rating of the player before the match
 * @param opponentElo The elo rating of the opponent before the match
 * @param playerScore The score of the player in the match (W=1, D=0.5, L=0)
 * @param numMatches The number of matches the player has played
 * @returns The change in Elo rating for the player
 */
export function getEloChange(playerElo: number, opponentElo: number, playerScore: number, numMatches: number) {
    const K = getKFactor(numMatches);
    return Math.round(K * (playerScore - expectedScore(playerElo, opponentElo)));
}