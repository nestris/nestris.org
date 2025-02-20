export enum League {
    MINO_1 = 0,
    MINO_2 = 1,
    MINO_3 = 2,
    MINO_4 = 3,
    MINO_5 = 4,
    BETTA_1 = 5,
    BETTA_2 = 6,
    BETTA_3 = 7,
    BETTA_4 = 8,
    BETTA_5 = 9,
    RUBY_1 = 10,
    RUBY_2 = 11,
    RUBY_3 = 12,
    RUBY_4 = 13,
    RUBY_5 = 14,
}

export const LEAGUE_NAMES = {
    [League.MINO_1]: "Mino I",
    [League.MINO_2]: "Mino II",
    [League.MINO_3]: "Mino III",
    [League.MINO_4]: "Mino IV",
    [League.MINO_5]: "Mino V",
    [League.BETTA_1]: "Betta I",
    [League.BETTA_2]: "Betta II",
    [League.BETTA_3]: "Betta III",
    [League.BETTA_4]: "Betta IV",
    [League.BETTA_5]: "Betta V",
    [League.RUBY_1]: "Ruby I",
    [League.RUBY_2]: "Ruby IV",
    [League.RUBY_3]: "Ruby III",
    [League.RUBY_4]: "Ruby IV",
    [League.RUBY_5]: "Ruby V",
}

// The amount of xp needed to advance from this league to the next league
export const LEAGUE_XP_REQUIREMENTS = {
    [League.MINO_1]: 2000,
    [League.MINO_2]: 3000,
    [League.MINO_3]: 4000,
    [League.MINO_4]: 6000,
    [League.MINO_5]: 8000,
    [League.BETTA_1]: 10000,
    [League.BETTA_2]: 20000,
    [League.BETTA_3]: 30000,
    [League.BETTA_4]: 40000,
    [League.BETTA_5]: 50000,
    [League.RUBY_1]: 60000,
    [League.RUBY_2]: 80000,
    [League.RUBY_3]: 100000,
    [League.RUBY_4]: 120000,
    [League.RUBY_5]: 150000,
}

export const LOWEST_LEAGUE = League.MINO_1;
export const HIGHEST_LEAGUE = League.RUBY_5;

export function getLeagueFromIndex(index: number): League {

    // If the index is out of bounds, return the closest valid league
    if (index < LOWEST_LEAGUE) return LOWEST_LEAGUE;
    if (index > HIGHEST_LEAGUE) return HIGHEST_LEAGUE;

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
    while (xp >= LEAGUE_XP_REQUIREMENTS[league] && league < HIGHEST_LEAGUE) {
        xp -= LEAGUE_XP_REQUIREMENTS[league];
        league++;
    }

    return { newXP: xp, newLeague: league };
}

export function leagueColor(league: League) {
    if (league <= League.MINO_5) return "#00CAFF";
    if (league <= League.BETTA_5) return "#F67C1B";
    else return "#FF354D";
}

export function previousLeague(league: League) {
    if (league === LOWEST_LEAGUE) throw new Error('No previous league');
    return (league - 1) as League;
}