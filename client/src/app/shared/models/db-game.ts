export enum DBGameType {
    SOLO = 'solo',
    RANKED_MATCH = 'ranked_match'
}

export interface DBGame {
    id: string,
    type: DBGameType,
    created_at: Date,
    userid: string,
    start_level: number,
    end_score: number,
    end_level: number,
    end_lines: number,
    accuracy: number,
    tetris_rate: number,
    xp_gained: number,
    average_eval_loss: number,
    brilliant_count: number,
    best_count: number,
    excellent_count: number,
    good_count: number,
    inaccurate_count: number,
    mistake_count: number,
    blunder_count: number,

    username?: string,
    data_exists?: boolean,
    rank?: number
}

export const DBGameAttributes = [
    'id',
    'type',
    'created_at',
    'userid',
    'start_level',
    'end_score',
    'end_level',
    'end_lines',
    'accuracy',
    'tetris_rate',
    'xp_gained',
    'average_eval_loss',
    'brilliant_count',
    'best_count',
    'excellent_count',
    'good_count',
    'inaccurate_count',
    'mistake_count',
    'blunder_count'
];