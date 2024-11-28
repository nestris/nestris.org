import { StatusHistory } from "../shared/tetris/memory-game-status";


const feedback = [
    // Great game
    "That was a masterclass in stacking!",
    "Impressive moves – you made it look easy!",
    "Perfection from start to finish.",
    "Flawless – pure perfection.",
  
    // Okay game
    "A respectable performance – keep stacking!",
    "A solid game from start to finish.",
    "Solid stacking! You’re getting better.",
  
  
  
    // Close calls with death
    "What a rollercoaster of a game!",
    "A nail-biter from start to finish!",
    "A chaotic game, but you made it work!",
    "You had us all on the edge of our seats!",
  
    // Bad to good
    "It started rough, but you clutched it in the end!",
    "A shaky start, but what a comeback!",
    "You turned it around when it mattered most!",
  
    // Bad ending
    "It was all going so well until disaster struck.",
    "An incredible game with a bittersweet ending.",
    "Great game, tragic ending.",
    "The ending? Let’s not talk about it.",
    "What a way to ruin it!",
  
    // Bad game
    "Blocks just weren’t your friends today.",
    "Hey, even the pros have bad games sometimes!",
    "You played Tetris. That’s all we can really say.",
  
    // 2+ missed spins
    "Looks like the spins just weren’t hitting today...",
    "You almost spun your way to greatness – almost.",
    "Those spins deserved better.",
  
    // Droughts
    "Who needs long bars anyway?",
    "Who needs long bars? Oh, wait… you do.",
    "Long bars are extinct, apparently.",
    "Long bars called in sick.",
  
  
    // Early topout
    "Well, that escalated quickly.",
    "Game over? Already? Impressive.",
    "You tried. Kind of.",
    "Did you even try?",
    "Well, that was embarrassing.",
    "Shortest game in history!",
  ]

/**
 * Get feedback based on how the player performed in the game
 * @param score Final score of the game
 * @param previousBest Previous best score of the player
 * @param history History of the game status across the game
 */
export function getFeedback(score: number, previousBest: number, history: StatusHistory): string {
    return feedback[Math.floor(Math.random() * feedback.length)];
}

