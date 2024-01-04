const NSTC_GRAVITY: {[key: number] : number} = {
    0: 48,
    1: 43,
    2: 38,
    3: 33,
    4: 28,
    5: 23,
    6: 18,
    7: 13,
    8: 8,
    9: 6,
    10: 5,
    11: 5,
    12: 5,
    13: 4,
    14: 4,
    15: 4,
    16: 3,
    17: 3,
    18: 3,
    19: 2,
    29: 1,
};

// get how many frames a frame drop takes
export function getGravity(level: number) {
    
    if (level <= 18) {
      return NSTC_GRAVITY[level];
    } else if (level < 29) {
      return 2;
    } else {
      return 1;
    }
  }