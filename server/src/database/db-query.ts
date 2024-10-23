import { Pool, QueryResult as PgQueryResult } from 'pg';
import { DeploymentEnvironment } from '../../shared/models/server-stats';

require('dotenv').config();

// PostgreSQL connection pool setup
const pool = new Pool({
    host: 'postgres',
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});

/**
 * Abstract base class for database queries.
 * @template T The type of the query result.
 */
export abstract class DBQuery<T> {
    /** The SQL query string. */
    public abstract query: string;

    /** The maximum reasonable time for the query to execute in milliseconds. If null, no time set. If exceeded, a warning is thrown */
    public abstract warningMs: number | null; 

    /**
     * Parse the raw database result into the desired output type.
     * @param resultRows The raw rows returned from the database.
     * @returns The parsed result of type T.
     */
    public abstract parseResult(resultRows: any[]): T;

    constructor(public readonly params: any[]) {}
}

/**
 * Abstract base class for database queries that write to the database and do not return a result.
 */
export abstract class WriteDBQuery extends DBQuery<void> {
    public override parseResult(resultRows: any[]): void {}
}

/**
 * Main Database class for executing queries.
 */
export class Database {
    // Time in milliseconds to artificially delay queries in development.
    static readonly ARTIFICIAL_DB_LAG_MS = 100;

    /**
     * Establish initial connection to the database.
     * @throws Will throw an error if connection fails.
     */
    public static async connect() {
        try {
            const client = await pool.connect();
            console.log('Successfully connected to the database.');
            client.release();
        } catch (error) {
            console.error('Failed to connect to the database:', error);
            throw error;
        }
    }

    /**
     * Execute a database query.
     * @template T The type of the query result.
     * @template P The type of the query parameters.
     * @param QueryClass The class of the query to be executed.
     * @param params The parameters for the query.
     * @returns A promise that resolves to the query result.
     * @throws Will throw an error if the query execution fails.
     */
    public static async query<T, P extends any[]>(
        QueryClass: new (...params: P) => DBQuery<T>,
        ...params: P
    ): Promise<T> {
        // Create a new instance of the query class
        const dbQuery = new QueryClass(...params);

        // Execute the query, measure the time it takes
        const start = Date.now();
        const res = await pool.query(dbQuery.query, dbQuery.params);
        const duration = Date.now() - start;

        // log the query and duration
        if (dbQuery.warningMs !== null && duration > dbQuery.warningMs) {
            console.warn(`WARNING: Query ${dbQuery.query} exceeded reasonable time limit of ${dbQuery.warningMs}ms. Executed in ${duration}ms`);
        } else {
            console.log(`Query ${dbQuery.query} executed in ${duration}ms`);
        }

        // If in development, inject artificial lag
        if (process.env.NODE_ENV === DeploymentEnvironment.DEV) {
            await new Promise((resolve) => setTimeout(resolve, Database.ARTIFICIAL_DB_LAG_MS));
        }

        // Convert the raw result into the desired output type
        return dbQuery.parseResult(res.rows);
        
    }
}

/**
 * Example usage of the Database class and making a query.
 */
interface TestQueryResult {
    username: string;
}

class TestQuery extends DBQuery<TestQueryResult> {
    public query = `SELECT * FROM users WHERE username = $1`;
    public warningMs = 200;

    constructor(userid: string) {
        super([userid]);
    }

    public parseResult(resultRows: any[]): TestQueryResult {
        if (resultRows.length === 0) {
            throw new Error('User not found');
        }
        return { username: resultRows[0].username };
    }
}

async function example() {
    const a = await Database.query(TestQuery, 'hello');
}