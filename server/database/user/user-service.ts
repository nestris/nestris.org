import mongoose from "mongoose";
import { IUserSchema } from "./user-schema";

// Retrieves a user from the database based on the provided username.
export async function getUserByUsername(username: string): Promise<IUserSchema | undefined> {
    const user = await mongoose.model('User').findOne({ username: username });
    if (!user) return undefined;
    return user;
}

// Retrieves a user from the database based on the provided Gmail address.
export async function getUserByGmail(gmail: string): Promise<IUserSchema | undefined> {
    const user = await mongoose.model('User').findOne({ gmail: gmail });
    if (!user) return undefined;
    return user;
}

/**
 * Creates a new user in the database with the specified username and gmail.
 * It ensures that the username and gmail are unique and throws an informative error if a duplicate is found.
 */
export async function createUser(username: string, gmail: string): Promise<IUserSchema> {
    try {
        const User = mongoose.model('User'); // Get the User model
        const newUser = new User({ username, gmail });
        await newUser.save();
        return newUser;
    } catch (error: any) {
        if (error.code === 11000) {
            // 11000 is the code for duplicate key error in MongoDB
            const field = error.message.split("index:")[1].split(" ")[0];
            throw new Error(`An account with this ${field.trim()} already exists.`);
        } else {
            // Handle other types of errors
            throw error;
        }
    }
}