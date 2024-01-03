import DBUser, { IUserSchema } from "./user-schema";

// Retrieves a user from the database based on the provided username.
export async function getUserByUsername(username: string): Promise<IUserSchema | undefined> {
    const user = await DBUser.findOne({ username: username });
    if (!user) return undefined;
    return user;
}

// Retrieves a user from the database based on the provided Gmail address.
export async function getUserByGmail(gmail: string): Promise<IUserSchema | undefined> {
    const user = await DBUser.findOne({ gmail: gmail });
    if (!user) return undefined;
    return user;
}

export async function getAllUsernames(): Promise<string[]> {
    const users = await DBUser.find({});
    return users.map(user => user.username);
}

/**
 * Creates a new user in the database with the specified username and gmail.
 * It ensures that the username and gmail are unique and throws an informative error if a duplicate is found.
 */
export async function createUser(username: string, gmail: string): Promise<IUserSchema> {
    try {
        const newUser = new DBUser({ username, gmail });
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

/*
* Replaces the user with the specified username with the provided user data.
* Returns the updated user.
*/
export async function updateUser(username: string, newData: IUserSchema): Promise<IUserSchema | null> {
    try {
        // Replace the user data and return the updated user
        const updatedUser = await DBUser.findOneAndUpdate({ username }, newData, {
            new: true, // Return the modified document rather than the original.
            runValidators: true // Ensure the update adheres to the schema
        });

        return updatedUser;
    } catch (error) {
        console.error("An error occurred while replacing the user:", error);
        throw error; // Rethrow the error for further handling
    }
}