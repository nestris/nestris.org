import { RandomRNG } from "./random-rng";
import { RNG } from "./rng";

export enum RNGType {
    RANDOM = "Random",
}

export const ALL_RNG_TYPES: RNGType[] = [
    RNGType.RANDOM,
];

export const RNG_MAP: { [type in RNGType]: RNG } = {
    [RNGType.RANDOM]: new RandomRNG(),
};