#!/usr/bin/env node

import { MongoClient } from 'mongodb';

/**
 * DBClient class that handles the connection to MongoDB and provides utility functions.
 * This class is responsible for managing the connection to the MongoDB database,
 * and providing methods to check connection status and retrieve data from collections.
 */
class DBClient {
    /**
     * Constructor that creates and connects to a MongoDB client.
     * The connection parameters are retrieved from environment variables, 
     * with defaults provided if variables are not set.
     */
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';

        const url = `mongodb://${host}:${port}`;
        this.client = new MongoClient(url, { useUnifiedTopology: true });

        this.database = database;
        this.client.connect()
            .then(() => console.log(`Connected to MongoDB at ${url}/${database}`))
            .catch((error) => console.error('Error connecting to MongoDB:', error));
    }

    /**
     * Checks whether the connection to MongoDB is successful.
     * Returns true if connected, false otherwise.
     *
     * @returns {boolean} true if connected to MongoDB, false otherwise
     */
    isAlive() {
        return this.client.isConnected();
    }

    /**
     * Retrieves the number of users in the 'users' collection.
     * This method returns the count of documents in the 'users' collection.
     *
     * @returns {Promise<number>} The number of documents in the 'users' collection.
     */
    async nbUsers() {
        try {
            const db = this.client.db(this.database);
            const usersCollection = db.collection('users');
            const count = await usersCollection.countDocuments();
            return count;
        } catch (error) {
            console.error('Error fetching user count:', error);
            return 0;
        }
    }

    /**
     * Retrieves the number of files in the 'files' collection.
     * This method returns the count of documents in the 'files' collection.
     *
     * @returns {Promise<number>} The number of documents in the 'files' collection.
     */
    async nbFiles() {
        try {
            const db = this.client.db(this.database);
            const filesCollection = db.collection('files');
            const count = await filesCollection.countDocuments();
            return count;
        } catch (error) {
            console.error('Error fetching file count:', error);
            return 0;
        }
    }
}

// Create an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
