// ORDER MUST BE PRESERVED AS THIS CORRESPONDS TO POSITION IN POSTGRES ARRAY
export enum QuestID {
    FIRST_BLOOD,
    RISING_STAR,
    MAXOUT_CITY,
    HARRY_HONG,
    JOSEPH_SALEE,
    GAME_BREAKER,
    SURVIVOR_I,
    SURVIVOR_II,
    SURVIVOR_III,
    SURVIVOR_IV,
    PUZZLER_I,
    PUZZLER_II,
    PUZZLER_III,
    PUZZLER_IV,
    PUZZLER_V,
    CHAMPION_I,
    CHAMPION_II,
    CHAMPION_III,
    CHAMPION_IV,
    EFFICIENCY_I,
    EFFICIENCY_II,
    EFFICIENCY_III,
    EFFICIENCY_IV,
    EFFICIENCY_V,
    PERFECTION_I,
    PERFECTION_II,
    PERFECTION_III,
    PERFECTION_IV,
    PERFECTION_V,
    FAST_FINGERS,
    FASTER_FINGERS,
    QUICKSILVER,
    AUTOMATON,
    SOCIAL_BUTTERFLY,
    EAGER_CATERPILLAR,
}

export const ALL_QUEST_IDS = Object.values(QuestID).filter(id => typeof id === 'number') as QuestID[];

export enum QuestCategory {
    SCORE = "Score",
    SURVIVOR = "Survivor",
    PUZZLER = "Puzzler",
    CHAMPION = "Champion",
    EFFICIENCY = "Efficiency",
    PERFECTION = "Perfection",
    FRIENDS = "Friends",
    ACCURACY = "Accuracy",
    LINES29 = "Lines29"
}

export enum QuestDifficulty {
    EASY = "Easy",
    INTERMEDIATE = "Intermediate",
    ADVANCED = "Advanced",
    EXPERT = "Expert",
    IMPOSSIBLE = "Impossible"
}

export const QUEST_DIFFICULTY_ORDER = [
    QuestDifficulty.EASY,
    QuestDifficulty.INTERMEDIATE,
    QuestDifficulty.ADVANCED,
    QuestDifficulty.EXPERT,
    QuestDifficulty.IMPOSSIBLE
];

export const QUEST_COLORS = {
    [QuestDifficulty.EASY]: "#58D774",
    [QuestDifficulty.INTERMEDIATE]: "#5874D7",
    [QuestDifficulty.ADVANCED]: "#D76758",
    [QuestDifficulty.EXPERT]: "#9F58D7",
    [QuestDifficulty.IMPOSSIBLE]: "#FFA500"
};

export enum QuestRedirect {
    SOLO = "solo",
    SOLO_ACCURACY = "solo_accuracy",
    RANKED = "ranked",
    PUZZLES = "puzzles",
    FRIENDS = "friends",
}

export const CATEGORY_REDIRECT: {[key in QuestCategory] : QuestRedirect} = {
    [QuestCategory.ACCURACY]: QuestRedirect.SOLO_ACCURACY,
    [QuestCategory.CHAMPION]: QuestRedirect.RANKED,
    [QuestCategory.EFFICIENCY]: QuestRedirect.SOLO,
    [QuestCategory.LINES29]: QuestRedirect.SOLO,
    [QuestCategory.FRIENDS]: QuestRedirect.FRIENDS,
    [QuestCategory.PERFECTION]: QuestRedirect.SOLO_ACCURACY,
    [QuestCategory.PUZZLER]: QuestRedirect.PUZZLES,
    [QuestCategory.SCORE]: QuestRedirect.SOLO,
    [QuestCategory.SURVIVOR]: QuestRedirect.SOLO,
}

export interface Quest {
    id: QuestID;
    category: QuestCategory;
    name: string;
    description: string;
    difficulty: QuestDifficulty;
    xp: number;
    targetScore: number;
}

export interface QuestStatus {
    currentScore: number;
    completed: boolean;
}

export const QUESTS: Record<QuestID, Quest> = {
    [QuestID.FIRST_BLOOD]: {
        id: QuestID.FIRST_BLOOD,
        category: QuestCategory.SCORE,
        name: "First blood",
        description: "Score at least 100,000 points in a game",
        difficulty: QuestDifficulty.EASY,
        xp: 200,
        targetScore: 100000,
    },
    [QuestID.RISING_STAR]: {
        id: QuestID.RISING_STAR,
        category: QuestCategory.SCORE,
        name: "Rising star",
        description: "Score at least 500,000 points in a game",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 750,
        targetScore: 500000,
    },
    [QuestID.MAXOUT_CITY]: {
        id: QuestID.MAXOUT_CITY,
        category: QuestCategory.SCORE,
        name: "Maxout city",
        description: "Score at least 1,000,000 points in a game, known as a 'maxout'",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 2500,
        targetScore: 1000000
    },
    [QuestID.HARRY_HONG]: {
        id: QuestID.HARRY_HONG,
        category: QuestCategory.SCORE,
        name: "Harry Hong",
        description: "Score at least 1,200,000 points in a game",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 4000,
        targetScore: 1200000
    },
    [QuestID.JOSEPH_SALEE]: {
        id: QuestID.JOSEPH_SALEE,
        category: QuestCategory.SCORE,
        name: "Joseph Saelee",
        description: "Score at least 1,400,000 points in a game",
        difficulty: QuestDifficulty.EXPERT,
        xp: 15000,
        targetScore: 1400000
    },
    [QuestID.GAME_BREAKER]: {
        id: QuestID.GAME_BREAKER,
        category: QuestCategory.SCORE,
        name: "Game breaker",
        description: "Rollover the score by scoring at least 1,600,000 points in a game",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 30000,
        targetScore: 1600000
    },
    [QuestID.SURVIVOR_I]: {
        id: QuestID.SURVIVOR_I,
        category: QuestCategory.SURVIVOR,
        name: "Survivor I",
        description: "Survive for 100 lines in a game",
        difficulty: QuestDifficulty.EASY,
        xp: 400,
        targetScore: 100
    },
    [QuestID.SURVIVOR_II]: {
        id: QuestID.SURVIVOR_II,
        category: QuestCategory.SURVIVOR,
        name: "Survivor II",
        description: "Reach the lovingly named 'killscreen' at level 29",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 1500,
        targetScore: 29
    },
    [QuestID.SURVIVOR_III]: {
        id: QuestID.SURVIVOR_III,
        category: QuestCategory.SURVIVOR,
        name: "Survivor III",
        description: "Survive past the killscreen and reach level 30!",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 3000,
        targetScore: 30
    },
    [QuestID.SURVIVOR_IV]: {
        id: QuestID.SURVIVOR_IV,
        category: QuestCategory.SURVIVOR,
        name: "Survivor IV",
        description: "Survive 100 lines on killscreen and reach level 39",
        difficulty: QuestDifficulty.EXPERT,
        xp: 12000,
        targetScore: 39
    },
    [QuestID.PUZZLER_I]: {
        id: QuestID.PUZZLER_I,
        category: QuestCategory.PUZZLER,
        name: "Puzzler I",
        description: "Reach a high of 1000 elo in puzzles",
        difficulty: QuestDifficulty.EASY,
        xp: 200,
        targetScore: 1000
    },
    [QuestID.PUZZLER_II]: {
        id: QuestID.PUZZLER_II,
        category: QuestCategory.PUZZLER,
        name: "Puzzler II",
        description: "Reach a high of 2000 elo in puzzles",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 750,
        targetScore: 2000
    },
    [QuestID.PUZZLER_III]: {
        id: QuestID.PUZZLER_III,
        category: QuestCategory.PUZZLER,
        name: "Puzzler III",
        description: "Reach a high of 3000 elo in puzzles",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 2000,
        targetScore: 3000
    },
    [QuestID.PUZZLER_IV]: {
        id: QuestID.PUZZLER_IV,
        category: QuestCategory.PUZZLER,
        name: "Puzzler IV",
        description: "Reach a high of 4000 elo in puzzles",
        difficulty: QuestDifficulty.EXPERT,
        xp: 5000,
        targetScore: 4000
    },
    [QuestID.PUZZLER_V]: {
        id: QuestID.PUZZLER_V,
        category: QuestCategory.PUZZLER,
        name: "Puzzler V",
        description: "Reach a high of 5000 elo in puzzles",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 20000,
        targetScore: 5000
    },
    [QuestID.CHAMPION_I]: {
        id: QuestID.CHAMPION_I,
        category: QuestCategory.CHAMPION,
        name: "Champion I",
        description: "Win 10 games in ranked mode",
        difficulty: QuestDifficulty.EASY,
        xp: 300,
        targetScore: 10
    },
    [QuestID.CHAMPION_II]: {
        id: QuestID.CHAMPION_II,
        category: QuestCategory.CHAMPION,
        name: "Champion II",
        description: "Reach 2000 trophies in ranked mode",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 1000,
        targetScore: 2000
    },
    [QuestID.CHAMPION_III]: {
        id: QuestID.CHAMPION_III,
        category: QuestCategory.CHAMPION,
        name: "Champion III",
        description: "Reach 2500 trophies in ranked mode",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 3000,
        targetScore: 2500
    },
    [QuestID.CHAMPION_IV]: {
        id: QuestID.CHAMPION_IV,
        category: QuestCategory.CHAMPION,
        name: "Champion IV",
        description: "Reach 3000 trophies in ranked mode",
        difficulty: QuestDifficulty.EXPERT,
        xp: 10000,
        targetScore: 3000
    },
    [QuestID.EFFICIENCY_I]: {
        id: QuestID.EFFICIENCY_I,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency I",
        description: "Score back-to-back quads in a game",
        difficulty: QuestDifficulty.EASY,
        xp: 100,
        targetScore: 2
    },
    [QuestID.EFFICIENCY_II]: {
        id: QuestID.EFFICIENCY_II,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency II",
        description: "Score five back-to-back quads in a game",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 500,
        targetScore: 5
    },
    [QuestID.EFFICIENCY_III]: {
        id: QuestID.EFFICIENCY_III,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency III",
        description: "Score 10 back-to-back quads in a game",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 2000,
        targetScore: 10
    },
    [QuestID.EFFICIENCY_IV]: {
        id: QuestID.EFFICIENCY_IV,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency IV",
        description: "Score 20 back-to-back quads in a game",
        difficulty: QuestDifficulty.EXPERT,
        xp: 5000,
        targetScore: 20
    },
    [QuestID.EFFICIENCY_V]: {
        id: QuestID.EFFICIENCY_V,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency V",
        description: "Score 50 back-to-back quads in a game",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 30000,
        targetScore: 50
    },
    [QuestID.PERFECTION_I]: {
        id: QuestID.PERFECTION_I,
        category: QuestCategory.PERFECTION,
        name: "Perfection I",
        description: "Make 5 best placements in a row",
        difficulty: QuestDifficulty.EASY,
        xp: 200,
        targetScore: 5
    },
    [QuestID.PERFECTION_II]: {
        id: QuestID.PERFECTION_II,
        category: QuestCategory.PERFECTION,
        name: "Perfection II",
        description: "Make 10 best placements in a row",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 500,
        targetScore: 10,
    },
    [QuestID.PERFECTION_III]: {
        id: QuestID.PERFECTION_III,
        category: QuestCategory.PERFECTION,
        name: "Perfection III",
        description: "Make 20 best placements in a row",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 2000,
        targetScore: 20
    },
    [QuestID.PERFECTION_IV]: {
        id: QuestID.PERFECTION_IV,
        category: QuestCategory.PERFECTION,
        name: "Perfection IV",
        description: "Make 50 best placements in a row",
        difficulty: QuestDifficulty.EXPERT,
        xp: 12000,
        targetScore: 50
    },
    [QuestID.PERFECTION_V]: {
        id: QuestID.PERFECTION_V,
        category: QuestCategory.PERFECTION,
        name: "Perfection V",
        description: "Make 100 best placements in a row",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 20000,
        targetScore: 100
    },
    [QuestID.AUTOMATON]: {
        id: QuestID.AUTOMATON,
        category: QuestCategory.ACCURACY,
        name: "Automaton",
        description: "Maintain 95% accuracy on a full game to level 29",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 50000,
        targetScore: 95
    },
    [QuestID.FAST_FINGERS]: {
        id: QuestID.FAST_FINGERS,
        category: QuestCategory.LINES29,
        name: "Fast fingers",
        description: "Make some noise on the 'killscreen' and clear 5 lines on level 29 start",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 1000,
        targetScore: 5
    },
    [QuestID.FASTER_FINGERS]: {
        id: QuestID.FASTER_FINGERS,
        category: QuestCategory.LINES29,
        name: "Faster fingers",
        description: "Survive deep into the 'killscreen', clearing 25 lines on level 29 start",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 2500,
        targetScore: 25
    },
    [QuestID.QUICKSILVER]: {
        id: QuestID.QUICKSILVER,
        category: QuestCategory.LINES29, 
        name: "Quicksilver",
        description: "Do the impossible on the 'killscreen' and survive for 500 lines on level 29 start",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 40000,
        targetScore: 500
    },
    [QuestID.EAGER_CATERPILLAR]: {
        id: QuestID.EAGER_CATERPILLAR,
        category: QuestCategory.FRIENDS,
        name: "Eager caterpillar",
        description: "Find some pals to play with and make friends with 5 other players",
        difficulty: QuestDifficulty.EASY,
        xp: 200,
        targetScore: 5
    },
    [QuestID.SOCIAL_BUTTERFLY]: {
        id: QuestID.SOCIAL_BUTTERFLY,
        category: QuestCategory.FRIENDS,
        name: "Social butterfly",
        description: "Achieve legendary status by befriending a sizable squad of 20 players",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 500,
        targetScore: 20
    }
};


export function getQuest(questID: QuestID): Quest {
    const quest = QUESTS[questID];
    if (!quest) throw new Error(`Quest not found: ${questID}`);
    return quest;
}

// Returns the current score and whether the quest is completed
export function getQuestStatus(quest_progress: number[], questID: QuestID): QuestStatus {
    const quest = getQuest(questID);

    const currentScore = quest_progress[questID] ?? 0;

    // Otherwise, return the current score and whether the quest is completed
    return {
        currentScore: currentScore,
        completed: currentScore >= quest.targetScore
    };
}

export function getQuestIdByCategoryAndDifficulty(
    category: QuestCategory, 
    difficulty: QuestDifficulty
): QuestID | undefined {
    const quest = Object.values(QUESTS).find(q => q.category === category && q.difficulty === difficulty);
    return quest?.id;
}