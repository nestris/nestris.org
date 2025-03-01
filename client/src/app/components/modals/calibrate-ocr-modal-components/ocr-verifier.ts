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
import { GameStartSchema, PacketOpcode } from "src/app/shared/network/stream-packets/packet";
import { PacketDisassembler } from "src/app/shared/network/stream-packets/packet-disassembler";
import { TetrominoType } from "src/app/shared/tetris/tetromino-type";

export interface OCRVerificationStatus {
    newGame: boolean,
    firstPiece: boolean,
    nextPiece: boolean
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
        const config: OCRConfig = { startLevel: 0, multipleGames: true };
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
    current: TetrominoType;
    next: TetrominoType;
}

class OCRPacketSender extends PacketSender {
    
    public readonly status$ = new BehaviorSubject<OCRVerificationStatus>({
        newGame: false,
        firstPiece: false,
        nextPiece: false
    });

    private gameData: GameData | null = null;

    public override sendPacket(rawPacket: BinaryEncoder): void {
        const disassembler = new PacketDisassembler(rawPacket.convertToUInt8Array(), false);
        const packet = disassembler.nextPacket();
        
        switch (packet.opcode) {
            case PacketOpcode.GAME_START:
                const gameStartPacket = packet.content as GameStartSchema;
                this.gameData = {
                    current: gameStartPacket.current,
                    next: gameStartPacket.next
                };

                this.status$.next({
                    newGame: true,
                    firstPiece: false,
                    nextPiece: false,
                });

                return;
            case PacketOpcode.GAME_END:
                this.gameData = null;

                this.status$.next({
                    newGame: false,
                    firstPiece: false,
                    nextPiece: false,
                });
                return;
        };

        console.log("packet received", packet);
    }

}