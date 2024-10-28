interface SortableLeaderboardRow {
    score: number;
    rank: number;
}

// Sort leaderboard, populating ranks with 1-based indexing, and where ties are given the same rank
export function sortLeaderboard(leaderboard: SortableLeaderboardRow[]) {
    leaderboard.sort((a, b) => b.score - a.score);
    let rank = 1;
    for (let i = 0; i < leaderboard.length; i++) {
        if (i > 0 && leaderboard[i].score !== leaderboard[i - 1].score) {
            rank = i + 1;
        }
        leaderboard[i].rank = rank;
    }
}