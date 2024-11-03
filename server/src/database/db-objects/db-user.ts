import { Observable, Subject } from "rxjs";
import { Authentication, DBUser, DBUserAttributes } from "../../../shared/models/db-user";
import { getLeagueFromIndex, updateXP } from "../../../shared/nestris-org/league-system";
import { DBObject } from "../db-object";
import { DBObjectNotFoundError } from "../db-object-error";
import { Database, DBQuery, WriteDBQuery } from "../db-query";
import { QuestDefinitions } from "../../../shared/nestris-org/quest-system";


// The parameters required to create a new user
export interface DBUserParams {
    username: string,
    is_guest: boolean
}

abstract class DBUserEvent {
    constructor() {}
}

// When user connects to the server, update last_online
export class DBUserOnlineEvent extends DBUserEvent {}

// Add XP to user, possibly promoting to a new league
export class DBAlterXPEvent extends DBUserEvent {
    constructor(public readonly xpDelta: number) { super(); }
}

// Update user's trophies by trophyDelta amount
export class DBAlterTrophiesEvent extends DBUserEvent {
    constructor(public readonly trophyDelta: number) { super(); }
}

// Update user stats after puzzle submission
export class DBOnPuzzleSubmitEvent extends DBUserEvent {
    constructor(
        public readonly newElo: number, // new elo after puzzle submission
        public readonly isCorrect: boolean, // whether the puzzle was solved
        public readonly seconds: number, // seconds taken to solve puzzle
    ) { super(); }
}

// Update highest stats on game end
export class DBOnGameEndEvent extends DBUserEvent {
    constructor(
        public readonly score: number,
        public readonly level: number,
        public readonly lines: number,
        public readonly transitionInto19: number | null,
        public readonly transitionInto29: number | null,
        public readonly perfectTransitionInto19: boolean,
        public readonly perfectTransitionInto29: boolean
    ) { super(); }
}

// Update settings
export class DBUpdateSettingsEvent extends DBUserEvent {
    constructor(
        public readonly enableReceiveFriendRequests: boolean,
        public readonly notifyOnFriendOnline: boolean,
        public readonly soloChatPermission: string,
        public readonly matchChatPermission: string,
        public readonly keybindEmuMoveLeft: string,
        public readonly keybindEmuMoveRight: string,
        public readonly keybindEmuRotLeft: string,
        public readonly keybindEmuRotRight: string,
        public readonly keybindPuzzleRotLeft: string,
        public readonly keybindPuzzleRotRight: string
    ) { super(); }
}

export interface JustCompletedQuest {
    userid: string,
    sessionid: string,
    questName: string,
}


export class DBUserObject extends DBObject<DBUser, DBUserParams, DBUserEvent>("DBUser") {

    protected override async fetchFromDB(): Promise<DBUser> {

        class UserQuery extends DBQuery<DBUser> {

            public override query = `
                SELECT ${DBUserAttributes.join(',')} FROM users WHERE userid = $1
            `;
        
            public override warningMs = null;
        
            constructor(userid: string) {
                super([userid]);
            }
        
            public override parseResult(resultRows: any[]): DBUser {
                if (resultRows.length === 0) {
                    throw new DBObjectNotFoundError('User not found');
                }
                return resultRows[0];
            }
        }

        return await Database.query(UserQuery, this.id);
    }

    // Given parameters, create the DBUser in-memory with initial values
    protected override createInMemory(params: DBUserParams): DBUser {
        return {
            userid: this.id,
            username: params.username,
            is_guest: params.is_guest,
            authentication: Authentication.USER,
            created_at: new Date(),
            last_online: new Date(),
            league: 0,
            xp: 0,
            trophies: 0,
            highest_trophies: 0,
            puzzle_elo: 0,
            highest_puzzle_elo: 0,
            puzzles_attempted: 0,
            puzzles_solved: 0,
            puzzle_seconds_played: 0,
            highest_score: 0,
            highest_level: 0,
            highest_lines: 0,
            highest_transition_into_19: 0,
            highest_transition_into_29: 0,
            has_perfect_transition_into_19: false,
            has_perfect_transition_into_29: false,
            enable_receive_friend_requests: true,
            notify_on_friend_online: true,
            solo_chat_permission: 'everyone',
            match_chat_permission: 'everyone',
            keybind_emu_move_left: 'ArrowLeft',
            keybind_emu_move_right: 'ArrowRight',
            keybind_emu_rot_left: 'Z',
            keybind_emu_rot_right: 'X',
            keybind_puzzle_rot_left: 'Z',
            keybind_puzzle_rot_right: 'X'
        };
    }

    // Given the newly-created in-memory object, create it in the database
    protected override async createInDatabase(newUser: DBUser): Promise<void> {

        class CreateUserQuery extends WriteDBQuery {
            public override query = `
                INSERT INTO users (
                    ${DBUserAttributes.join(',')}
                ) VALUES (
                    ${DBUserAttributes.map((_, i) => `$${i + 1}`).join(',')}
                )
            `;
            public override warningMs = null;
        
            constructor(newUser: DBUser) {
                super(DBUserAttributes.map(attr => (newUser as any)[attr]));
            }
        }

        await Database.query(CreateUserQuery, newUser);
    }

    // Completely deletes the object from the database
    protected override deleteFromDatabase(): Promise<void> {

        class DeleteUserQuery extends WriteDBQuery {
            public override query = `DELETE FROM users WHERE userid = $1`;
            public override warningMs = null;
        
            constructor(userid: string) {
                super([userid]);
            }
        }

        return Database.query(DeleteUserQuery, this.id);
    }
    
    // Given an event, alters the object in-memory
    protected override alterInMemory(event: DBUserEvent): void {

        const before = Object.assign({}, this.inMemoryObject);

        switch (event.constructor) {

            // On user online, update last_online to now
            case DBUserOnlineEvent:
                this.inMemoryObject.last_online = new Date();
                break;

            // On alter XP, add xpDelta to xp. If xp is enough to promote to a new league, promote
            case DBAlterXPEvent:
                const xpEvent = event as DBAlterXPEvent;
                const currentLeague = getLeagueFromIndex(this.inMemoryObject.league);
                const { newXP, newLeague } = updateXP(this.inMemoryObject.xp, currentLeague, xpEvent.xpDelta);
                this.inMemoryObject.xp = newXP;
                this.inMemoryObject.league = newLeague;
                break;
            
            // On alter trophies, add trophyDelta to trophies, ensuring trophies is non-negative
            case DBAlterTrophiesEvent:
                const trophyEvent = event as DBAlterTrophiesEvent;
                this.inMemoryObject.trophies = Math.max(0, this.inMemoryObject.trophies + trophyEvent.trophyDelta);
                break;

            // On alter puzzle elo, update puzzle stats
            case DBOnPuzzleSubmitEvent:
                const puzzleEvent = event as DBOnPuzzleSubmitEvent;
                this.inMemoryObject.puzzle_elo = puzzleEvent.newElo;
                this.inMemoryObject.puzzles_attempted++;
                this.inMemoryObject.puzzles_solved += puzzleEvent.isCorrect ? 1 : 0;
                this.inMemoryObject.puzzle_seconds_played += puzzleEvent.seconds;
                break;

            // On game end, update highest stats
            case DBOnGameEndEvent:
                const gameEndEvent = event as DBOnGameEndEvent;
                this.inMemoryObject.highest_score = Math.max(this.inMemoryObject.highest_score, gameEndEvent.score);
                this.inMemoryObject.highest_level = Math.max(this.inMemoryObject.highest_level, gameEndEvent.level);
                this.inMemoryObject.highest_lines = Math.max(this.inMemoryObject.highest_lines, gameEndEvent.lines);
                this.inMemoryObject.highest_transition_into_19 = Math.max(this.inMemoryObject.highest_transition_into_19, gameEndEvent.transitionInto19 ?? 0);
                this.inMemoryObject.highest_transition_into_29 = Math.max(this.inMemoryObject.highest_transition_into_29, gameEndEvent.transitionInto29 ?? 0);
                this.inMemoryObject.has_perfect_transition_into_19 = this.inMemoryObject.has_perfect_transition_into_19 || gameEndEvent.perfectTransitionInto19;
                this.inMemoryObject.has_perfect_transition_into_29 = this.inMemoryObject.has_perfect_transition_into_29 || gameEndEvent.perfectTransitionInto29;
                break;

            // Update settings
            case DBUpdateSettingsEvent:
                const settingsEvent = event as DBUpdateSettingsEvent;
                this.inMemoryObject.enable_receive_friend_requests = settingsEvent.enableReceiveFriendRequests;
                this.inMemoryObject.notify_on_friend_online = settingsEvent.notifyOnFriendOnline;
                this.inMemoryObject.solo_chat_permission = settingsEvent.soloChatPermission;
                this.inMemoryObject.match_chat_permission = settingsEvent.matchChatPermission;
                this.inMemoryObject.keybind_emu_move_left = settingsEvent.keybindEmuMoveLeft;
                this.inMemoryObject.keybind_emu_move_right = settingsEvent.keybindEmuMoveRight;
                this.inMemoryObject.keybind_emu_rot_left = settingsEvent.keybindEmuRotLeft;
                this.inMemoryObject.keybind_emu_rot_right = settingsEvent.keybindEmuRotRight;
                this.inMemoryObject.keybind_puzzle_rot_left = settingsEvent.keybindPuzzleRotLeft;
                this.inMemoryObject.keybind_puzzle_rot_right = settingsEvent.keybindPuzzleRotRight;
                break;
        }
    }

    // Save altered DBUser to the database
    protected override saveToDatabase(): Promise<void> {

        const userid = this.id;

        class SaveUserQuery extends WriteDBQuery {
            public override query = `
                UPDATE users SET (
                    ${DBUserAttributes.join(',')}
                ) = (
                    ${DBUserAttributes.map((_, i) => `$${i + 1}`).join(',')}
                ) WHERE userid = $${DBUserAttributes.length + 1}
            `;
            public override warningMs = null;
        
            constructor(user: DBUser) {
                super(DBUserAttributes.map(attr => (user as any)[attr]).concat([userid]));
            }
        }

        return Database.query(SaveUserQuery, this.inMemoryObject);
    }

}