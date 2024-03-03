import mongoose, { ConnectOptions } from "mongoose";

function getConnectionString() {

    const isProduction = process.env['PRODUCTION'] === 'true'

    if (isProduction) {
        console.log("Connecting to production database...");
        const username = process.env['MONGODB_USERNAME']!;
        const password = process.env['MONGODB_PASSWORD']!;
        const database = process.env['MONGODB_DATABASE']!;
        return `mongodb+srv://${username}:${password}@${database}/?retryWrites=true&w=majority`;
    } else {
        console.log("Connecting to local database...");
        return "mongodb://localhost:27017";
    }

}

// must call this function to initialize the MongoDB connection
export async function connectToDatabase() {
    
    const connectionString = getConnectionString();
    console.log("Connecting to MongoDB instance:", connectionString);

    try {
        await mongoose.connect(connectionString);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
    
}