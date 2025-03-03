import { UserSessionID } from "../online-users/online-user";
import { MultiplayerRoomState, PlayerIndex, TrophyDelta, XPDelta } from "../../shared/room/multiplayer-room-models";
import { MultiplayerRoom } from "./multiplayer-room";
import { v4 as uuid } from 'uuid';
import { DBRankedMatchEndEvent, DBUserObject } from "../database/db-objects/db-user";
import { RoomError } from "../online-users/event-consumers/room-consumer";
import { EventConsumerManager } from "../online-users/event-consumer";
import { GlobalStatConsumer } from "../online-users/event-consumers/global-stat-consumer";
import { QuestConsumer } from "../online-users/event-consumers/quest-consumer";
import { QuestCategory, QuestID } from "../../shared/nestris-org/quest-system";
import { TrophyChangeMessage } from "../../shared/network/json-message";
import { ActivityConsumer } from "../online-users/event-consumers/activity-consumer";
import { ActivityType } from "../../shared/models/activity";
import { Platform } from "../../shared/models/platform";


export class RankedMultiplayerRoom extends MultiplayerRoom {

    // Unique match ID for this ranked multiplayer match
    private readonly matchID: string = uuid();

    private readonly startTime = Date.now();

    constructor(
        player1SessionID: UserSessionID,
        player2SessionID: UserSessionID,
        player1TrophyDelta: TrophyDelta, // How much player 1 will gain/lose
        player2TrophyDelta: TrophyDelta, // How much player 2 will gain/lose
        player1Platform: Platform | null,
        player2Platform: Platform | null,
    ) {
        super(
            player1SessionID, player2SessionID, player1TrophyDelta, player2TrophyDelta,
            player1Platform, player2Platform,
            true, // Ranked
            18, // Start level
            0.5, // Winning score: single game decides winner
        );
    }

    /**
     * On end of ranked multiplayer match, update trophies and XP for both players based on the match result.
     * @param state The state of the room
     */
    protected async onMatchEnd(state: MultiplayerRoomState): Promise<void> {

        if (state.matchWinner === null) throw new RoomError('Match winner must be defined');
        
        const questConsumer = EventConsumerManager.getInstance().getConsumer(QuestConsumer);
        const activityConsumer = EventConsumerManager.getInstance().getConsumer(ActivityConsumer);

        // Iterate through each player in the game to update trophies and XP
        this.iterateGamePlayers(async (player, playerIndex) => {

            // Calculate trophy change
            const trophyDelta = playerIndex === PlayerIndex.PLAYER_1 ? this.player1TrophyDelta : this.player2TrophyDelta;
            let trophyChange;
            if (state.matchWinner === PlayerIndex.DRAW) trophyChange = Math.round((trophyDelta.trophyGain + trophyDelta.trophyLoss) / 2);
            else if (state.matchWinner === playerIndex) trophyChange = trophyDelta.trophyGain;
            else trophyChange = trophyDelta.trophyLoss;

            const startTrophies = state.players[playerIndex].trophies;
            const newTrophies = startTrophies + trophyChange;
            const xpBonusIfWin = Math.floor(newTrophies * 0.1);

            // Send trophy change message to display alert
            RankedMultiplayerRoom.Users.sendToUserSession(player.sessionID, new TrophyChangeMessage(
                startTrophies, trophyChange
            ))

            // Update each player's trophies and XP after the match
            const updatedUser = await DBUserObject.alter(player.userid, new DBRankedMatchEndEvent({
                xpGained: state.matchWinner === playerIndex ? xpBonusIfWin : 0, // solo xp gain handled by GamePlayer
                win: state.matchWinner === playerIndex,
                lose: state.matchWinner !== playerIndex && state.matchWinner !== PlayerIndex.DRAW,
                trophyChange: trophyChange,
            }), false);

            // Update quest progress non-blocking
            questConsumer.updateChampionQuestCategory(player.userid, updatedUser.wins, updatedUser.highest_trophies);

            // Update activity non-blocking
            const otherIndex = playerIndex === PlayerIndex.PLAYER_1 ? PlayerIndex.PLAYER_2 : PlayerIndex.PLAYER_1;
            if (state.points.length === 1) activityConsumer.createActivity(player.userid, {
                type: ActivityType.RANKED_MATCH,
                opponentID: state.players[otherIndex].userid,
                opponentName: state.players[otherIndex].username,
                trophyDelta: trophyChange,
                myGameID: state.points[0].game[playerIndex].gameID,
                myScore: state.points[0].game[playerIndex].score,
                opponentGameID: state.points[0].game[otherIndex].gameID,
                opponentScore: state.points[0].game[otherIndex].score,
            })
        });

        // Update global stats for how long the match took
        const globalStatConsumer = EventConsumerManager.getInstance().getConsumer(GlobalStatConsumer);
        const durationSeconds = (Date.now() - this.startTime) / 1000;
        globalStatConsumer.onMatchEnd(durationSeconds);
    }

    /**
     * On creating the ranked multiplayer room, add match to the database
     */
    protected override async onCreate(): Promise<void> {

        const  { userid: player1UserID, trophies: player1Trophies } = this.getRoomState().players[PlayerIndex.PLAYER_1];
        const  { userid: player2UserID, trophies: player2Trophies } = this.getRoomState().players[PlayerIndex.PLAYER_2];

        // TODO: Add match to database
        
    }
}