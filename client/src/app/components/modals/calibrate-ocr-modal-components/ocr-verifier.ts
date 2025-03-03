/**
 * Verifies that OCR is live and valid. Checks for:
 *  1. Level 0 start
 *  2. A new game
 *  3. First piece placed correctly
 *  4. Second piece placed correctly
 */

import { BehaviorSubject, map, Observable } from "rxjs";
import { OCRConfig } from "src/app/ocr/state-machine/ocr-state-machine";
import { PacketSender } from "src/app/ocr/util/packet-sender";
import { OcrGameService } from "src/app/services/ocr/ocr-game.service";
import { BinaryEncoder } from "src/app/shared/network/binary-codec";
import { GamePlacementPacket, GamePlacementSchema, GameStartSchema, PacketOpcode } from "src/app/shared/network/stream-packets/packet";
import { PacketDisassembler } from "src/app/shared/network/stream-packets/packet-disassembler";
import { randomInt } from "src/app/shared/scripts/math";
import MoveableTetromino from "src/app/shared/tetris/moveable-tetromino";
import { TetrisBoard } from "src/app/shared/tetris/tetris-board";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";

export interface OCRVerificationStatus {
    startLevel: boolean,
    newGame: boolean,
    firstPiece: boolean,
    secondPiece: boolean,
    firstPlacement?: MoveableTetromino,
    secondPlacement?: MoveableTetromino,
}

export class OCRVerifier {

    private readonly packetSender = new OCRPacketSender;

    /**
     * Starts OCR state machine and reads packets to check for live and valid OCR calibration.
     * Must start at level 0
     */
    constructor(
        private readonly ocrGameService: OcrGameService
    ) {
        const config: OCRConfig = { startLevel: null, seed: null, multipleGames: true };
        this.ocrGameService.startGameCapture(config, this.packetSender);
    }

    /**
     * Must call this to clean up resources
     */
    public destroy() {
        this.ocrGameService.stopGameCapture();
    }

    /**
     * @returns The current verification status
     */
    public getStatus$(): Observable<OCRVerificationStatus> {
        return this.packetSender.status$.asObservable();
    }

    public getStatus(): OCRVerificationStatus {
        return this.packetSender.status$.getValue();
    }

}

interface GameData {
    startLevel: number;
    current: TetrominoType;
    next: TetrominoType;
}

class OCRPacketSender extends PacketSender {
    
    public readonly status$ = new BehaviorSubject<OCRVerificationStatus>({
        startLevel: false,
        newGame: false,
        firstPiece: false,
        secondPiece: false
    });

    private gameData: GameData | null = null;
    private placementIndex: number = 0;

    private modifyStatus(modify: any) {
        const newStatus = Object.assign({}, this.status$.getValue(), modify);
        this.status$.next(newStatus);
    }

    public override sendPacket(rawPacket: BinaryEncoder): void {
        const disassembler = new PacketDisassembler(rawPacket.convertToUInt8Array(), false);
        const packet = disassembler.nextPacket();
        
        switch (packet.opcode) {
            case PacketOpcode.GAME_START:
                const gameStartPacket = packet.content as GameStartSchema;
                this.gameData = {
                    startLevel: gameStartPacket.level,
                    current: gameStartPacket.current,
                    next: gameStartPacket.next
                };

                this.placementIndex = 0;

                if (gameStartPacket.level !== 0) {
                    this.status$.next({ startLevel: false, newGame: true, firstPiece: false, secondPiece: false, });
                    return;
                }

                const { firstPlacement, secondPlacement } = generateVerificationPlacements(gameStartPacket.current, gameStartPacket.next);
                console.log("Verify placements");
                firstPlacement.print();
                secondPlacement.print();
                this.status$.next({
                    startLevel: true,
                    newGame: true,
                    firstPiece: false,
                    secondPiece: false,
                    firstPlacement, secondPlacement
                });
                return;

            case PacketOpcode.GAME_PLACEMENT:
                // we only care about first two placements
                if (!this.gameData || this.placementIndex > 1) return;

                const tetrominoType = (this.placementIndex === 0) ? this.gameData.current : this.gameData.next;
                const mtPose = (packet.content as GamePlacementSchema).mtPose;
                const placement = MoveableTetromino.fromMTPose(tetrominoType, mtPose);

                const status = this.status$.getValue();
                if (this.placementIndex === 0 && status.firstPlacement && placement.equals(status.firstPlacement)) {
                    this.modifyStatus({firstPiece : true});
                }
                if (this.placementIndex === 1 && status.secondPlacement && placement.equals(status.secondPlacement)) {
                    this.modifyStatus({secondPiece : true});
                }

                this.placementIndex++;
                return;

            case PacketOpcode.GAME_END:
                this.gameData = null;

                this.status$.next({
                    startLevel: false,
                    newGame: false,
                    firstPiece: false,
                    secondPiece: false,
                });
                return;
        };
    }

}

function generateVerificationPlacements(current: TetrominoType, next: TetrominoType) {

    // Generate first placement
    const board = new TetrisBoard();
    const firstPlacement = generateVerificationPlacement(board, current);
    
    // Generate second placement
    firstPlacement.blitToBoard(board);
    const secondPlacement = generateVerificationPlacement(board, next);

    return { firstPlacement, secondPlacement };

}

function generateVerificationPlacement(board: TetrisBoard, piece: TetrominoType) {

    // Find rotation and x position
    const placement = MoveableTetromino.fromSpawnPose(piece);
    const rotation = randomInt(0, 3);
    const translation = randomInt(-2, -2);
    placement.moveBy(rotation, translation, 5);

    // Drop piece until valid placement
    while (!placement.isValidPlacement(board)) {
        placement.moveBy(0, 0, 1);
    }

    return placement;

}