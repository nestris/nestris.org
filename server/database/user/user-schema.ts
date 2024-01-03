import mongoose from "mongoose";
import { prop, getModelForClass } from '@typegoose/typegoose';

// Define the IUser interface
export interface IUserSchema {
    username: string;
    gmail: string;
    lastOnline: Date;
    isProUser: boolean;
    friends: string[];
    outgoingFriendRequests: string[];
    incomingFriendRequests: string[];
    joinDate: Date;
    gamesPlayedConsole: number;
    gamesPlayedOnline: number;
    playHours: number;
    matchesAborted: number;
    matchesWon: number;
    matchesLost: number;
    trophies: number;
    xp: number;
    puzzleElo: number;
    puzzlesSolved: number;
    bestScore: number;
    bestAccuracy: number;
    bestTrophies: number;
    dailyBest: { date: Date, score: number }[];
}

class DailyBest {
    @prop({ required: true })
    public date!: Date;

    @prop({ required: true })
    public score!: number;
}

// User class with Typegoose decorators, implementing the IUser interface
class UserSchema implements IUserSchema {
    @prop({ required: true, unique: true, index: true })
    public username!: string;

    @prop({ required: true, unique: true, index: true })
    public gmail!: string;

    @prop({ required: true, default: Date.now })
    public lastOnline!: Date;

    @prop({ required: true, default: false })
    public isProUser!: boolean;

    @prop({ type: () => [String], required: true, default: [] })
    public friends!: string[];

    @prop({ type: () => [String], required: true, default: [] })
    public outgoingFriendRequests!: string[];

    @prop({ type: () => [String], required: true, default: [] })
    public incomingFriendRequests!: string[];

    @prop({ required: true, default: Date.now })
    public joinDate!: Date;

    @prop({ required: true, default: 0 })
    public gamesPlayedConsole!: number;

    @prop({ required: true, default: 0 })
    public gamesPlayedOnline!: number;

    @prop({ required: true, default: 0 })
    public playHours!: number;

    @prop({ required: true, default: 0 })
    public matchesAborted!: number;

    @prop({ required: true, default: 0 })
    public matchesWon!: number;

    @prop({ required: true, default: 0 })
    public matchesLost!: number;

    @prop({ required: true, default: 0, index: true })
    public trophies!: number;

    @prop({ required: true, default: 0, index: true })
    public xp!: number;

    @prop({ required: true, default: 0, index: true })
    public puzzleElo!: number;

    @prop({ required: true, default: 0 })
    public puzzlesSolved!: number;

    @prop({ required: true, default: 0 })
    public bestScore!: number;

    @prop({ required: true, default: 0 })
    public bestAccuracy!: number;

    @prop({ required: true, default: 0 })
    public bestTrophies!: number;

    @prop({ required: true, default: [] })
    public dailyBest!: DailyBest[];
}

// Convert User class to a Mongoose model
const DBUser = getModelForClass(UserSchema);

export default DBUser;
