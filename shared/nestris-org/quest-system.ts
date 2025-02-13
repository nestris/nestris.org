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
    PUZZLER_5,
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
    AUTOMATON,
    QUICKSILVER,
    JUGGERNAUT,
    SOCIAL_BUTTERFLY,
}

export enum QuestCategory {
    SCORE = "Score",
    SURVIVOR = "Survivor",
    PUZZLER = "Puzzler",
    CHAMPION = "Champion",
    EFFICIENCY = "Efficiency",
    PERFECTION = "Perfection"
}

export enum QuestDifficulty {
    EASY = "Easy",
    INTERMEDIATE = "Intermediate",
    ADVANCED = "Advanced",
    EXPERT = "Expert",
    IMPOSSIBLE = "Impossible"
}
const questDifficultyOrder = [QuestDifficulty.EASY, QuestDifficulty.INTERMEDIATE, QuestDifficulty.ADVANCED, QuestDifficulty.EXPERT, QuestDifficulty.IMPOSSIBLE];

export const QUEST_COLORS = {
    [QuestDifficulty.EASY]: "#58D774",
    [QuestDifficulty.INTERMEDIATE]: "#5874D7",
    [QuestDifficulty.ADVANCED]: "#D76758",
    [QuestDifficulty.EXPERT]: "#9F58D7",
    [QuestDifficulty.IMPOSSIBLE]: "#FFA500"
};

export interface Quest {
    id: QuestID;
    category?: QuestCategory;
    name: string;
    description: string;
    difficulty: QuestDifficulty;
    xp: number;
    targetScore: number;
}

export interface QuestStatus extends Quest {
    currentScore: number;
    completed: boolean;
}

export const QUESTS: Quest[] = [
    {
        id: QuestID.FIRST_BLOOD,
        category: QuestCategory.SCORE,
        name: "First blood",
        description: "Score at least 100,000 points in a game",
        difficulty: QuestDifficulty.EASY,
        xp: 10,
        targetScore: 100000,
    },
    {
        id: QuestID.RISING_STAR,
        category: QuestCategory.SCORE,
        name: "Rising star",
        description: "Score at least 500,000 points in a game",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 20,
        targetScore: 500000,
    },
    {
        id: QuestID.MAXOUT_CITY,
        category: QuestCategory.SCORE,
        name: "Maxout city",
        description: "Score at least 1,000,000 points in a game, known as a 'maxout'",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 1000,
        targetScore: 1000000
    },
    {
        id: QuestID.HARRY_HONG,
        category: QuestCategory.SCORE,
        name: "Harry Hong",
        description: "Score at least 1,200,000 points in a game",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 2000,
        targetScore: 1200000
    },
    {
        id: QuestID.JOSEPH_SALEE,
        category: QuestCategory.SCORE,
        name: "Joseph Salee",
        description: "Score at least 1,400,000 points in a game",
        difficulty: QuestDifficulty.EXPERT,
        xp: 5000,
        targetScore: 1400000
    },
    {
        id: QuestID.GAME_BREAKER,
        category: QuestCategory.SCORE,
        name: "Game breaker",
        description: "Rollover the score by scoring at least 1,600,000 points in a game",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 5000,
        targetScore: 1600000
    },
    {
        id: QuestID.SURVIVOR_I,
        category: QuestCategory.SURVIVOR,
        name: "Survivor I",
        description: "Survive for 100 lines in a game",
        difficulty: QuestDifficulty.EASY,
        xp: 100,
        targetScore: 100
    },
    {
        id: QuestID.SURVIVOR_II,
        category: QuestCategory.SURVIVOR,
        name: "Survivor II",
        description: "Reach the lovingly named 'killscreen' at level 29",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 100,
        targetScore: 29
    },
    {
        id: QuestID.SURVIVOR_III,
        category: QuestCategory.SURVIVOR,
        name: "Survivor III",
        description: "Survive past the killscreen and reach level 30!",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 100,
        targetScore: 30
    },
    {
        id: QuestID.SURVIVOR_IV,
        category: QuestCategory.SURVIVOR,
        name: "Survivor III",
        description: "Survive 100 lines on killscreen and reach level 39",
        difficulty: QuestDifficulty.EXPERT,
        xp: 100,
        targetScore: 30
    },
    {
        id: QuestID.PUZZLER_I,
        category: QuestCategory.PUZZLER,
        name: "Puzzler I",
        description: "Reach a high of 1000 elo in puzzles",
        difficulty: QuestDifficulty.EASY,
        xp: 10,
        targetScore: 1000
    },
    {
        id: QuestID.PUZZLER_II,
        category: QuestCategory.PUZZLER,
        name: "Puzzler II",
        description: "Reach a high of 2000 elo in puzzles",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 10,
        targetScore: 2000
    },
    {
        id: QuestID.PUZZLER_III,
        category: QuestCategory.PUZZLER,
        name: "Puzzler III",
        description: "Reach a high of 3000 elo in puzzles",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 10,
        targetScore: 3000
    },
    {
        id: QuestID.PUZZLER_IV,
        category: QuestCategory.PUZZLER,
        name: "Puzzler IV",
        description: "Reach a high of 4000 elo in puzzles",
        difficulty: QuestDifficulty.EXPERT,
        xp: 10,
        targetScore: 4000
    },
    {
        id: QuestID.PUZZLER_5,
        category: QuestCategory.PUZZLER,
        name: "Puzzler V",
        description: "Reach a high of 5000 elo in puzzles",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 10,
        targetScore: 5000
    },
    {
        id: QuestID.CHAMPION_I,
        category: QuestCategory.CHAMPION,
        name: "Champion I",
        description: "Win 10 games in ranked mode",
        difficulty: QuestDifficulty.EASY,
        xp: 10,
        targetScore: 10
    },
    {
        id: QuestID.CHAMPION_II,
        category: QuestCategory.CHAMPION,
        name: "Champion II",
        description: "Reach 2000 trophies in ranked mode",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 10,
        targetScore: 2000
    },
    {
        id: QuestID.CHAMPION_III,
        category: QuestCategory.CHAMPION,
        name: "Champion III",
        description: "Reach 2500 trophies in ranked mode",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 10,
        targetScore: 2500
    },
    {
        id: QuestID.CHAMPION_IV,
        category: QuestCategory.CHAMPION,
        name: "Champion IV",
        description: "Reach 3000 trophies in ranked mode",
        difficulty: QuestDifficulty.EXPERT,
        xp: 10,
        targetScore: 3000
    },
    {
        id: QuestID.EFFICIENCY_I,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency I",
        description: "Score back-to-back quads in a game",
        difficulty: QuestDifficulty.EASY,
        xp: 10,
        targetScore: 2
    },
    {
        id: QuestID.EFFICIENCY_II,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency II",
        description: "Score five back-to-back quads in a game",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 10,
        targetScore: 5
    },
    {
        id: QuestID.EFFICIENCY_III,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency III",
        description: "Score 10 back-to-back quads in a game",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 10,
        targetScore: 10
    },
    {
        id: QuestID.EFFICIENCY_IV,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency IV",
        description: "Score 20 back-to-back quads in a game",
        difficulty: QuestDifficulty.EXPERT,
        xp: 10,
        targetScore: 20
    },
    {
        id: QuestID.EFFICIENCY_V,
        category: QuestCategory.EFFICIENCY,
        name: "Efficiency V",
        description: "Score 50 back-to-back quads in a game",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 10,
        targetScore: 50
    },
    {
        id: QuestID.PERFECTION_I,
        category: QuestCategory.PERFECTION,
        name: "Perfection I",
        description: "Make 5 best placements in a row",
        difficulty: QuestDifficulty.EASY,
        xp: 10,
        targetScore: 5
    },
    {
        id: QuestID.PERFECTION_II,
        category: QuestCategory.PERFECTION,
        name: "Perfection II",
        description: "Make 10 best placements in a row",
        difficulty: QuestDifficulty.INTERMEDIATE,
        xp: 10,
        targetScore: 10,
    },
    {
        id: QuestID.PERFECTION_III,
        category: QuestCategory.PERFECTION,
        name: "Perfection III",
        description: "Make 20 best placements in a row",
        difficulty: QuestDifficulty.ADVANCED,
        xp: 10,
        targetScore: 20
    },
    {
        id: QuestID.PERFECTION_IV,
        category: QuestCategory.PERFECTION,
        name: "Perfection IV",
        description: "Make 50 best placements in a row",
        difficulty: QuestDifficulty.EXPERT,
        xp: 10,
        targetScore: 50
    },
    {
        id: QuestID.PERFECTION_V,
        category: QuestCategory.PERFECTION,
        name: "Perfection V",
        description: "Make 100 best placements in a row",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 10,
        targetScore: 100
    },
    {
        id: QuestID.AUTOMATON,
        name: "Automaton",
        description: "Maintain 95% accuracy on a full game to level 29",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 10000,
        targetScore: 95
    },
    {
        id: QuestID.QUICKSILVER,
        name: "Quicksilver",
        description: "Survive for 100 lines on level 29 start",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 10000,
        targetScore: 100
    },
    {
        id: QuestID.JUGGERNAUT,
        name: "Juggernaut",
        description: "Maintain a 100-0 win-loss record in ranked mode",
        difficulty: QuestDifficulty.IMPOSSIBLE,
        xp: 10000,
        targetScore: 100
    },
    {
        id: QuestID.SOCIAL_BUTTERFLY,
        name: "Social butterfly",
        description: "Be friends with 5 other players on the site",
        difficulty: QuestDifficulty.EASY,
        xp: 10,
        targetScore: 5
    }
];

// Sort quests first by difficulty, then by xp
QUESTS.sort((a, b) => {
    if (a.difficulty === b.difficulty) return a.xp - b.xp;
    return questDifficultyOrder.indexOf(a.difficulty) - questDifficultyOrder.indexOf(b.difficulty);
});

export function getQuest(questID: QuestID): Quest {
    const quest = QUESTS.find(q => q.id === questID);
    if (!quest) throw new Error(`Quest not found: ${questID}`);
    return quest;
}

export function getQuestStatus(quest_progress: number[], questID: QuestID): QuestStatus {
    const quest = getQuest(questID);
    return {
        ...quest,
        currentScore: quest_progress[questID],
        completed: quest_progress[questID] >= quest.targetScore
    };
}

export function didQuestJustComplete(old_quest_progress: number[], questID: QuestID, new_quest_progress: number): boolean {
    const quest = getQuest(questID);
    return old_quest_progress[questID] < quest.targetScore && new_quest_progress >= quest.targetScore;
}