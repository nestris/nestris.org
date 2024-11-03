import { DBUser } from "../models/db-user";

export enum QuestDifficulty {
    EASY = "Easy",
    MEDIUM = "Medium",
    HARD = "Hard",
    IMPOSSIBLE = "Impossible"
}

export const QUEST_COLORS = {
    [QuestDifficulty.EASY]: "#58D774",
    [QuestDifficulty.MEDIUM]: "#5874D7",
    [QuestDifficulty.HARD]: "#D76758",
    [QuestDifficulty.IMPOSSIBLE]: "#9F58D7"
};

export interface QuestDefinition {
    name: string;
    description: string;
    difficulty: QuestDifficulty;
    xp: number;
    computeScore: (user: DBUser) => number;
    targetScore: number;
}

export interface QuestResult {
    name: string;
    description: string;
    difficulty: QuestDifficulty;
    xp: number;
    currentScore: number;
    targetScore: number;
    complete: boolean;
}

export class QuestDefinitions {

    private static definitions: QuestDefinition[] = [];

    /**
     * Register a quest definition
     * @param definition The quest definition
     */
    public static register(definition: QuestDefinition) {
        this.definitions.push(definition);
    }

    /**
     * Get the quest definition by name
     */
    public static getQuestDefinition(name: string): QuestDefinition {
        return this.definitions.find(
            (quest) => quest.name === name
        )!;
    }

    /**
     * Get the quest result for a user
     * @param quest The quest
     * @param user The user
     */
    public static getQuestResult(quest: QuestDefinition, user: DBUser): QuestResult {

        const currentScore = quest.computeScore(user);

        return {
            name: quest.name,
            description: quest.description,
            difficulty: quest.difficulty,
            xp: quest.xp,
            currentScore: currentScore,
            targetScore: quest.targetScore,
            complete: currentScore >= quest.targetScore
        };
    }

    /**
     * Get the list of incomplete quests that are closest to completion
     * @param user The user
     * @param limit The maximum number of quests to return
     */
    public static getClosestIncompleteQuests(user: DBUser, limit: number): QuestResult[] {
        return this.definitions.map(
            quest => this.getQuestResult(quest, user)
        ).filter(
            quest => !quest.complete
        ).sort(
            (a, b) => (a.currentScore / a.targetScore) - (b.currentScore / b.targetScore)
        ).slice(0, limit);
    }

    /**
     * Get all the quest results for a user
     * @param user The user
     */
    public static getAllQuestResults(user: DBUser): QuestResult[] {
        return this.definitions.map(
            quest => this.getQuestResult(quest, user)
        );
    }

    /**
     * Get all quests that were improved after DBUser changed
     * @param oldUser The old user
     * @param newUser The new user
     */
    public static getImprovedQuests(oldUser: DBUser, newUser: DBUser): QuestResult[] {
        return this.definitions.filter(
            (quest) => quest.computeScore(newUser) > quest.computeScore(oldUser)
        ).map(
            (quest) => this.getQuestResult(quest, newUser)
        );
    }

    /**
     * Get all quests that have just been completed after DBUser changed
     * @param oldUser The old user
     * @param newUser The new user
     */
    public static getJustCompletedQuests(oldUser: DBUser, newUser: DBUser): QuestResult[] {
        return this.definitions.filter(
            (quest) => quest.computeScore(newUser) >= quest.targetScore && quest.computeScore(oldUser) < quest.targetScore
        ).map(
            (quest) => this.getQuestResult(quest, newUser)
        );
    }

}

QuestDefinitions.register({
    name: "First blood",
    description: "Break the six-figure mark! Reach 100,000 points in a game.",
    difficulty: QuestDifficulty.EASY,
    xp: 100,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 100000
});

QuestDefinitions.register({
    name: "Making noise",
    description: "Reach a double six-figure score of 200,000 points!",
    difficulty: QuestDifficulty.EASY,
    xp: 200,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 200000
});

QuestDefinitions.register({
    name: "Rising star",
    description: "Reach a mighty 300,000 points!",
    difficulty: QuestDifficulty.EASY,
    xp: 200,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 300000
});

QuestDefinitions.register({
    name: "Getting serious",
    description: "Reach 400,000 points in a game.",
    difficulty: QuestDifficulty.EASY,
    xp: 200,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 400000
});

QuestDefinitions.register({
    name: "Halfway to maxout",
    description: "Halfway to a maxout! Reach 500,000 points in a game.",
    difficulty: QuestDifficulty.EASY,
    xp: 500,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 500000
});

QuestDefinitions.register({
    name: "Novice no more",
    description: "You're getting there! Reach 600,000 points in a game.",
    difficulty: QuestDifficulty.EASY,
    xp: 500,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 600000
});

QuestDefinitions.register({
    name: "Future world champion",
    description: "Get close to a million with 800,000 points in a game",
    difficulty: QuestDifficulty.EASY,
    xp: 500,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 800000
});

QuestDefinitions.register({
    name: "Maxout city",
    description: "Reach 1,000,000 points in a game, known as a 'maxout'",
    difficulty: QuestDifficulty.MEDIUM,
    xp: 1000,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 1000000
});

QuestDefinitions.register({
    name: "Harry Hong was first",
    description: "Reach 1,200,000 points in a game",
    difficulty: QuestDifficulty.MEDIUM,
    xp: 1200,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 1200000
});

QuestDefinitions.register({
    name: "I recorded this time",
    description: "Reach 1,400,000 points in a game",
    difficulty: QuestDifficulty.HARD,
    xp: 1400,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 1400000
});

QuestDefinitions.register({
    name: "I broke the game",
    description: "Rollover the score by reaching 1,600,000 points in a game",
    difficulty: QuestDifficulty.HARD,
    xp: 1600,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 1600000
});

QuestDefinitions.register({
    name: "Tryhard",
    description: "Reach 2,000,000 points in a game",
    difficulty: QuestDifficulty.HARD,
    xp: 2000,
    computeScore: (user: DBUser) => user.highest_score,
    targetScore: 2000000
});

QuestDefinitions.register({
    name: "Can clear some lines",
    description: "Clear 100 lines in a game",
    difficulty: QuestDifficulty.EASY,
    xp: 100,
    computeScore: (user: DBUser) => user.highest_lines,
    targetScore: 100
});

QuestDefinitions.register({
    name: "Death by killscreen",
    description: "Reach the 'killscreen' at level 29 from a slower level",
    difficulty: QuestDifficulty.EASY,
    xp: 1000,
    computeScore: (user: DBUser) => user.highest_transition_into_29,
    targetScore: 29
});

QuestDefinitions.register({
    name: "No longer killscreen",
    description: "Reach level 30 starting at any level in a game",
    difficulty: QuestDifficulty.MEDIUM,
    xp: 1500,
    computeScore: (user: DBUser) => user.highest_level,
    targetScore: 30
});

QuestDefinitions.register({
    name: "Death by killscreen x2",
    description: "Reach level 39, the ultimate killscreen in the game",
    difficulty: QuestDifficulty.HARD,
    xp: 2000,
    computeScore: (user: DBUser) => user.highest_level,
    targetScore: 39
});

QuestDefinitions.register({
    name: "Pace Warlord",
    description: "Reach 1,300,000 points transitioning into level 29",
    difficulty: QuestDifficulty.HARD,
    xp: 1300,
    computeScore: (user: DBUser) => user.highest_transition_into_29,
    targetScore: 1300000
});

QuestDefinitions.register({
    name: "Ok Noah Dengler",
    description: "Reach 1,400,000 points transitioning into 29",
    difficulty: QuestDifficulty.HARD,
    xp: 1400,
    computeScore: (user: DBUser) => user.highest_transition_into_29,
    targetScore: 1400000
});

QuestDefinitions.register({
    name: "StackRabbit Whisperer",
    description: "Stack at over 90% accuracy transitioning into 29",
    difficulty: QuestDifficulty.MEDIUM,
    xp: 1500,
    computeScore: (user: DBUser) => user.highest_transition_into_29,
    targetScore: 29
});

QuestDefinitions.register({
    name: "StackRabbit Clone",
    description: "Stack at over 95% accuracy transitioning into 29",
    difficulty: QuestDifficulty.HARD,
    xp: 1600,
    computeScore: (user: DBUser) => user.highest_transition_into_29,
    targetScore: 29
});

QuestDefinitions.register({
    name: "Brain teaser",
    description: "Climb up to 1000 elo in rated puzzles",
    difficulty: QuestDifficulty.EASY,
    xp: 200,
    computeScore: (user: DBUser) => user.puzzle_elo,
    targetScore: 1000
});

QuestDefinitions.register({
    name: "Tolerable puzzler",
    description: "Reach 2000 elo in rated puzzles",
    difficulty: QuestDifficulty.EASY,
    xp: 200,
    computeScore: (user: DBUser) => user.puzzle_elo,
    targetScore: 2000
});

QuestDefinitions.register({
    name: "Pretty good puzzler",
    description: "Reach 3000 elo in rated puzzles",
    difficulty: QuestDifficulty.MEDIUM,
    xp: 300,
    computeScore: (user: DBUser) => user.puzzle_elo,
    targetScore: 3000
});

QuestDefinitions.register({
    name: "I make J dependencies",
    description: "Reach 4000 elo in rated puzzles",
    difficulty: QuestDifficulty.HARD,
    xp: 400,
    computeScore: (user: DBUser) => user.puzzle_elo,
    targetScore: 4000
});

QuestDefinitions.register({
    name: "Rather rapid",
    description: "Reach 100,000 points on level 29 start",
    difficulty: QuestDifficulty.HARD,
    xp: 100,
    computeScore: (user: DBUser) => user.highest_transition_into_29,
    targetScore: 100000
});

QuestDefinitions.register({
    name: "I win sometimes",
    description: "Reach 2000 trophies in ranked matches",
    difficulty: QuestDifficulty.EASY,
    xp: 200,
    computeScore: (user: DBUser) => user.trophies,
    targetScore: 2000
});

QuestDefinitions.register({
    name: "Pretty good player",
    description: "Reach 3000 trophies in ranked matches",
    difficulty: QuestDifficulty.MEDIUM,
    xp: 300,
    computeScore: (user: DBUser) => user.trophies,
    targetScore: 3000
});

QuestDefinitions.register({
    name: "Tolerable stacker",
    description: "Enter level 19 with at least 500,000 points",
    difficulty: QuestDifficulty.EASY,
    xp: 500,
    computeScore: (user: DBUser) => user.highest_transition_into_19,
    targetScore: 500000
});

QuestDefinitions.register({
    name: "Decent stacker",
    description: "Enter level 19 with at least 600,000 points",
    difficulty: QuestDifficulty.MEDIUM,
    xp: 600,
    computeScore: (user: DBUser) => user.highest_transition_into_19,
    targetScore: 600000
});

QuestDefinitions.register({
    name: "Pretty good stacker",
    description: "Enter level 19 with at least 700,000 points",
    difficulty: QuestDifficulty.MEDIUM,
    xp: 700,
    computeScore: (user: DBUser) => user.highest_transition_into_19,
    targetScore: 700000
});

QuestDefinitions.register({
    name: "I hate burning",
    description: "Achieve a perfect transition scoring only tetrises into level 19",
    difficulty: QuestDifficulty.HARD,
    xp: 1000,
    computeScore: (user: DBUser) => user.has_perfect_transition_into_19 ? 1 : 0,
    targetScore: 1
});

QuestDefinitions.register({
    name: "I hate burning x2",
    description: "Achieve a perfect transition scoring only tetrises into level 29",
    difficulty: QuestDifficulty.HARD,
    xp: 2000,
    computeScore: (user: DBUser) => user.has_perfect_transition_into_29 ? 1 : 0,
    targetScore: 1
});