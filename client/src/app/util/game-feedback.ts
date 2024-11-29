import { MemoryGameStatus, StatusSnapshot } from "../shared/tetris/memory-game-status";


const GREAT_GAME = [
    "That was a masterclass in stacking!",
    "Impressive moves – you made it look easy!",
    "Perfection from start to finish.",
    "Flawless – pure perfection.",
]

const GOOD_GAME = [
    "A solid performance with flashes of brilliance.",
    "A clean and well-executed game.",
    "A balanced game with some great moves.",
    
]

const DECENT_GAME = [
    "A respectable performance – keep stacking!",
    "A solid game from start to finish.",
    "Solid stacking! You’re getting better.",
    "Good job! You’ve got the basics down.",
    "That was a smooth game – keep it up!",
    "Well done! A steady and solid game.",
]


const ROLLERCOASTER = [
    "What a rollercoaster of a game!",
    "A nail-biter from start to finish!",
    "A chaotic game, but you made it work!",
    "You had us all on the edge of our seats!",
]

const BAD_TO_GOOD = [
    "It started rough, but you clutched it in the end!",
    "A shaky start, but what a comeback!",
    "You clawed your way back!",

]
  
const BAD_ENDING = [
    "It was all going so well until disaster struck.",
    "An incredible game with a bittersweet ending.",
    "Great game, tragic ending.",
    "The ending? Let’s not talk about it.",
    "What a way to ruin it!",
]

const BAD_GAME = [
    "Blocks just weren’t your friends today.",
    "Hey, even the pros have bad games sometimes!",
]

const REALLY_BAD_GAME = [
    "That game felt like a cry for help.",
    "I’d say ‘nice try,’ but was it really?",
    "Are you sure you weren’t trying to lose?",
    "That wasn’t a topout – that was a mercy ending."
]

  
const EARLY_TOPOUT = [
    "Well, that escalated quickly.",
    "Game over? Already? Impressive.",
    "You tried. Kind of.",
    "Did you even try?",
    "Well, that was embarrassing.",
    "Shortest game in history!",
    "Let’s just pretend this one didn’t happen.",
    "Good effort! Just kidding.",
]

const ONE_LINE_29 = [
    "You cleared one line. Are you proud of yourself?",
    "It's better than club zero, I guess.",
]

const BAD_29 = [
    "You managed to hang on for a moment.",
    "A fair attempt at such a brutal speed.",
    "Not quite a long run, but still a decent effort!",
    "You held on for a bit!",
]

const MID_29 = [
    "Not bad! You held on longer than most.",
    "You did well to survive that long.",
    "You’re getting the hang of this!",  
]

const GOOD_29 = [
    "You’re a natural at this!",
    "You made it look easy!",
]

const GREAT_29 = [
    "Are you an auto-clicker?",
    "Perfection from start to finish.",
    "Is this worth a broken keyboard?",
]


// Helper function to get a random element from an array
const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Get feedback based on how the player performed in the game
 * @param score Final score of the game
 * @param previousBest Previous best score of the player
 * @param history History of the game status across the game
 */
export function getFeedback(status: MemoryGameStatus, previousBestLines: number): string {


    // level 29 start is a special case
    if (status.startLevel >= 29) {

        if (status.lines === 1 && Math.random() < 0.5) return random(ONE_LINE_29);
        if (status.lines < 3) return random(EARLY_TOPOUT);
        if (status.lines < 5) return random(BAD_29);
        if (status.lines < 10) return random(MID_29);
        if (status.lines < 30) return random(GOOD_29);
        return random(GREAT_29);
    }

    const history = status.getHistory();

    const getTetrisRateWithCondition = (condition: (snapshot: StatusSnapshot) => boolean) => {
        const snapshots = [];
        for (let i = 0; i < history.length(); i++) {
            const snapshot = history.getSnapshot(i);
            if (condition(snapshot)) snapshots.push(snapshot);
        }
        if (snapshots.length === 0) return 0;

        // Get average tetris rate of snapshots
        const tetrisRates = snapshots.map(snapshot => snapshot.tetrisRate);
        return tetrisRates.reduce((a, b) => a + b) / tetrisRates.length;
    }

    const allTetrisRates = [];
    for (let i = 0; i < history.length(); i++) {
        const snapshot = history.getSnapshot(i);
        allTetrisRates.push(snapshot.tetrisRate);
    }
    console.log("all TRT", allTetrisRates);
    console.log("highest lines", previousBestLines);
    console.log("trt", status.getTetrisRate());

    // If lines is too low, it's an early topout
    if (status.lines < Math.max(Math.min(previousBestLines, 200) / 3, 30)) return random(EARLY_TOPOUT);

    // Games are guaranteed to have at least 30 lines

    // If score is close to previous best lines and good TRT, it's a great game
    if (status.lines >= Math.max(previousBestLines, 50) * 0.8) {
        if (status.getTetrisRate() >= 0.75) return random(GREAT_GAME);
        if (status.getTetrisRate() >= 0.5) return random(GOOD_GAME);
    }


    const fullTetrisRate = status.getTetrisRate();
    if (fullTetrisRate < 0.2) return random(REALLY_BAD_GAME);
    if (fullTetrisRate < 0.35) return random(BAD_GAME);

    
    if (status.lines > 50) {

        // Calculate early and late tetris rate by averaging early snapshots
        const earlyTetrisRate = getTetrisRateWithCondition(snapshot => snapshot.lines < status.lines / 3);
        const midTetrisRate = getTetrisRateWithCondition(snapshot => snapshot.lines > status.lines / 3 && snapshot.lines < status.lines * 2 / 3);
        const lateTetrisRate = getTetrisRateWithCondition(snapshot => snapshot.lines > status.lines * 2 / 3);
        console.log("Early, mid, late TRT", earlyTetrisRate, midTetrisRate, lateTetrisRate);

        if (earlyTetrisRate < 0.3 && lateTetrisRate > 0.6) return random(BAD_TO_GOOD);
        if (earlyTetrisRate > 0.6 && midTetrisRate > 0.6 && lateTetrisRate < 0.3) return random(BAD_ENDING);
    }

    // Check if tetris rates bounce between high and low many times, iterating over allTetrisRates
    let bounceCount = 0;
    let low = false;
    let high = false;
    for (let i = 0; i < allTetrisRates.length; i++) {
        if (allTetrisRates[i] < 0.3) {
            if (high) {
                bounceCount++;
                high = false;
            }
            low = true;
        } else if (allTetrisRates[i] > 0.75) {
            if (low) {
                bounceCount++;
                low = false;
            }
            high = true;
        }
    }
    console.log("Bounce count", bounceCount);
    if (bounceCount >= 5) return random(ROLLERCOASTER);

    if (fullTetrisRate > 0.6) return random(GOOD_GAME);
    return random(DECENT_GAME);
}

