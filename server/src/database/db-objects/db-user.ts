import { Authentication, DBUser } from "../../../shared/models/db-user";
import { getLeagueFromIndex, updateXP } from "../../../shared/nestris-org/league-system";
import { DBObject } from "../db-object";
import { DBObjectNotFoundError } from "../db-object-error";
import { Database, DBQuery, WriteDBQuery } from "../db-query";


// The parameters required to create a new user
export interface DBUserParams {
    username: string
}

abstract class DBUserEvent {}

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

// Update user's puzzle elo by eloDelta amount
export class DBAlterPuzzleEloEvent extends DBUserEvent {
    constructor(public readonly eloDelta: number) { super(); }
}

// Update highest stats on game end
export class DBOnGameEndEvent extends DBUserEvent {
    constructor(
        public readonly score: number,
        public readonly level: number,
        public readonly lines: number,
        public readonly accuracy: number,
        public readonly transitionInto19: number,
        public readonly transitionInto29: number,
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


export class DBUserObject extends DBObject<DBUser, DBUserParams, DBUserEvent>() {

    protected override async fetchFromDB(): Promise<DBUser> {

        class UserQuery extends DBQuery<DBUser> {

            public override query = `
                SELECT userid, username, authentication, created_at, last_online, league, xp, trophies, highest_trophies,
                    puzzle_elo, highest_puzzle_elo, highest_score, highest_level, highest_lines, highest_accuracy,
                    highest_transition_into_19, highest_transition_into_29, has_perfect_transition_into_19, has_perfect_transition_into_29,
                    enable_receive_friend_requests, notify_on_friend_online, solo_chat_permission, match_chat_permission,
                    keybind_emu_move_left, keybind_emu_move_right, keybind_emu_rot_left, keybind_emu_rot_right,
                    keybind_puzzle_rot_left, keybind_puzzle_rot_right
                FROM users WHERE userid = $1
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
            authentication: Authentication.USER,
            created_at: new Date(),
            last_online: new Date(),
            league: 0,
            xp: 0,
            trophies: 0,
            highest_trophies: 0,
            puzzle_elo: 0,
            highest_puzzle_elo: 0,
            highest_score: 0,
            highest_level: 0,
            highest_lines: 0,
            highest_accuracy: 0,
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
                INSERT INTO users (userid, username, authentication, created_at, last_online, league, xp, trophies, highest_trophies,
                    puzzle_elo, highest_puzzle_elo, highest_score, highest_level, highest_lines, highest_accuracy,
                    highest_transition_into_19, highest_transition_into_29, has_perfect_transition_into_19, has_perfect_transition_into_29,
                    enable_receive_friend_requests, notify_on_friend_online, solo_chat_permission, match_chat_permission,
                    keybind_emu_move_left, keybind_emu_move_right, keybind_emu_rot_left, keybind_emu_rot_right,
                    keybind_puzzle_rot_left, keybind_puzzle_rot_right)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
            `;
            public override warningMs = null;
        
            constructor(newUser: DBUser) {
                super([
                    newUser.userid, newUser.username, newUser.authentication, newUser.created_at, newUser.last_online, newUser.league, newUser.xp, newUser.trophies, newUser.highest_trophies,
                    newUser.puzzle_elo, newUser.highest_puzzle_elo, newUser.highest_score, newUser.highest_level, newUser.highest_lines, newUser.highest_accuracy,
                    newUser.highest_transition_into_19, newUser.highest_transition_into_29, newUser.has_perfect_transition_into_19, newUser.has_perfect_transition_into_29,
                    newUser.enable_receive_friend_requests, newUser.notify_on_friend_online, newUser.solo_chat_permission, newUser.match_chat_permission,
                    newUser.keybind_emu_move_left, newUser.keybind_emu_move_right, newUser.keybind_emu_rot_left, newUser.keybind_emu_rot_right,
                    newUser.keybind_puzzle_rot_left, newUser.keybind_puzzle_rot_right
                ]);
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

            // On alter puzzle elo, add eloDelta to puzzle_elo, ensuring puzzle_elo is non-negative
            case DBAlterPuzzleEloEvent:
                const eloEvent = event as DBAlterPuzzleEloEvent;
                this.inMemoryObject.puzzle_elo = Math.max(0, this.inMemoryObject.puzzle_elo + eloEvent.eloDelta);
                break;

            // On game end, update highest stats
            case DBOnGameEndEvent:
                const gameEndEvent = event as DBOnGameEndEvent;
                this.inMemoryObject.highest_score = Math.max(this.inMemoryObject.highest_score, gameEndEvent.score);
                this.inMemoryObject.highest_level = Math.max(this.inMemoryObject.highest_level, gameEndEvent.level);
                this.inMemoryObject.highest_lines = Math.max(this.inMemoryObject.highest_lines, gameEndEvent.lines);
                this.inMemoryObject.highest_accuracy = Math.max(this.inMemoryObject.highest_accuracy, gameEndEvent.accuracy);
                this.inMemoryObject.highest_transition_into_19 = Math.max(this.inMemoryObject.highest_transition_into_19, gameEndEvent.transitionInto19);
                this.inMemoryObject.highest_transition_into_29 = Math.max(this.inMemoryObject.highest_transition_into_29, gameEndEvent.transitionInto29);
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

        class SaveUserQuery extends WriteDBQuery {
            public override query = `
                UPDATE users SET last_online = $1, league = $2, xp = $3, trophies = $4, highest_trophies = $5,
                    puzzle_elo = $6, highest_puzzle_elo = $7, highest_score = $8, highest_level = $9, highest_lines = $10, highest_accuracy = $11,
                    highest_transition_into_19 = $12, highest_transition_into_29 = $13, has_perfect_transition_into_19 = $14, has_perfect_transition_into_29 = $15,
                    enable_receive_friend_requests = $16, notify_on_friend_online = $17, solo_chat_permission = $18, match_chat_permission = $19,
                    keybind_emu_move_left = $20, keybind_emu_move_right = $21, keybind_emu_rot_left = $22, keybind_emu_rot_right = $23,
                    keybind_puzzle_rot_left = $24, keybind_puzzle_rot_right = $25
                WHERE userid = $26
            `;
            public override warningMs = null;
        
            constructor(user: DBUser) {
                super([
                    user.last_online, user.league, user.xp, user.trophies, user.highest_trophies,
                    user.puzzle_elo, user.highest_puzzle_elo, user.highest_score, user.highest_level, user.highest_lines, user.highest_accuracy,
                    user.highest_transition_into_19, user.highest_transition_into_29, user.has_perfect_transition_into_19, user.has_perfect_transition_into_29,
                    user.enable_receive_friend_requests, user.notify_on_friend_online, user.solo_chat_permission, user.match_chat_permission,
                    user.keybind_emu_move_left, user.keybind_emu_move_right, user.keybind_emu_rot_left, user.keybind_emu_rot_right,
                    user.keybind_puzzle_rot_left, user.keybind_puzzle_rot_right,
                    user.userid
                ]);
            }
        }

        return Database.query(SaveUserQuery, this.inMemoryObject);
    }

}