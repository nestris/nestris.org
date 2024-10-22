export enum League {
    MINO_5 = 0,
    MINO_4 = 1,
    MINO_3 = 2,
    MINO_2 = 3,
    MINO_1 = 4,
    BETTA_5 = 5,
    BETTA_4 = 6,
    BETTA_3 = 7,
    BETTA_2 = 8,
    BETTA_1 = 9,
    RUBY_5 = 10,
    RUBY_4 = 11,
    RUBY_3 = 12,
    RUBY_2 = 13,
    RUBY_1 = 14,
}

export const LEAGUE_NAMES = {
    [League.MINO_5]: "Mino 5",
    [League.MINO_4]: "Mino 4",
    [League.MINO_3]: "Mino 3",
    [League.MINO_2]: "Mino 2",
    [League.MINO_1]: "Mino 1",
    [League.BETTA_5]: "Betta 5",
    [League.BETTA_4]: "Betta 4",
    [League.BETTA_3]: "Betta 3",
    [League.BETTA_2]: "Betta 2",
    [League.BETTA_1]: "Betta 1",
    [League.RUBY_5]: "Ruby 5",
    [League.RUBY_4]: "Ruby 4",
    [League.RUBY_3]: "Ruby 3",
    [League.RUBY_2]: "Ruby 2",
    [League.RUBY_1]: "Ruby 1",
}

// The amount of xp needed to advance from this league to the next league
export const LEAGUE_XP_REQUIREMENTS = {
    [League.MINO_5]: 5000,
    [League.MINO_4]: 6000,
    [League.MINO_3]: 7000,
    [League.MINO_2]: 8000,
    [League.MINO_1]: 9000,
    [League.BETTA_5]: 10000,
    [League.BETTA_4]: 20000,
    [League.BETTA_3]: 30000,
    [League.BETTA_2]: 40000,
    [League.BETTA_1]: 50000,
    [League.RUBY_5]: 100000,
    [League.RUBY_4]: 200000,
    [League.RUBY_3]: 300000,
    [League.RUBY_2]: 400000,
    [League.RUBY_1]: 500000,
}

export function getLeagueFromIndex(index: number): League {

    if (index < League.MINO_5 || index > League.RUBY_1) {
        throw new Error(`Invalid league index ${index}`);
    }

    return index as League;
}

/**
 * Given an initial xp and league, apply the xpDelta and return the new xp and league, possibly promoting the player to a new league.
 * @param xp The initial xp of the player
 * @param league The initial league of the player
 * @param xpDelta The amount of xp to add to the player
 * @returns The new xp and league of the player
 */
export function updateXP(xp: number, league: League, xpDelta: number): { newXP: number, newLeague: League } {

    if (xpDelta < 0) {
        throw new Error(`xpDelta must be non-negative, got ${xpDelta}`);
    }

    // Apply the xpDelta
    xp += xpDelta;

    // Keep promoting the player to the next league until they don't have enough xp to advance
    while (xp >= LEAGUE_XP_REQUIREMENTS[league] && league < League.RUBY_1) {
        league++;
        xp -= LEAGUE_XP_REQUIREMENTS[league];
    }

    return { newXP: xp, newLeague: league };
}