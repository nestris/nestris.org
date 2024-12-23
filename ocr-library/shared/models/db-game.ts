export interface DBGame {
    id: string,
    created_at: Date,
    userid: string,
    start_level: number,
    end_score: number,
    end_level: number,
    end_lines: number,
    accuracy: number,
    tetris_rate: number,
    xp_gained: number,
    username?: string,
    data_exists?: boolean
}

export const DBGameAttributes = [
    'id',
    'created_at',
    'userid',
    'start_level',
    'end_score',
    'end_level',
    'end_lines',
    'accuracy',
    'tetris_rate',
    'xp_gained'
];