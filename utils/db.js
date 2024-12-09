#!/usr/bin/env node

import mongodb from 'mongodb';
import Collection from 'mongodb/lib/collection';
import envLoader from './env_loader';

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
    envLoader();
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new mongodb.MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect();
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
    return this.client.db().collection('users').countDocuments();
  }

    /**
     * Retrieves the number of files in the 'files' collection.
     * This method returns the count of documents in the 'files' collection.
     *
     * @returns {Promise<number>} The number of documents in the 'files' collection.
     */
    async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }
    
    /**
   * Retrieves a reference to the `files` collection.
   * @returns {Promise<Collection>}
   */
    async usersCollection() {
    return this.client.db().collection('users');
    }
}

// Create an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
