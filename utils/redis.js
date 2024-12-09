#!/usr/bin/env node

import { createClient } from 'redis';
import { promisify } from 'util';

/**
 * RedisClient class that encapsulates methods for interacting with Redis.
 * Uses the 'redis' package's createClient method to connect to Redis.
 * Provides utility functions to check connection status and interact with Redis.
 */
class RedisClient {
    /**
     * Constructor that creates and configures a Redis client.
     * The constructor connects to Redis and handles error events.
     */
    constructor() {
        // Create a Redis client using createClient method
        this.client = createClient();

        // Handle errors from the Redis client by logging them to the console
        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        // Promisify Redis methods for cleaner async/await usage
        this.get = promisify(this.client.get).bind(this.client);
        this.set = promisify(this.client.set).bind(this.client);
        this.del = promisify(this.client.del).bind(this.client);
    }

    /**
     * Checks whether the Redis client is connected and alive.
     * Returns true if connected, otherwise false.
     *
     * @returns {boolean} true if Redis is connected, false otherwise
     */
    isAlive() {
        // Return true if the Redis client's status is 'ready'
        return this.client.connected;
    }

    /**
     * Retrieves a value from Redis for a given key.
     * Uses the promisified Redis 'get' method to return a value or null if an error occurs.
     *
     * @param {string} key - The key for which to retrieve the value.
     * @returns {Promise<string|null>} The value associated with the key, or null if not found.
     */
    async get(key) {
        try {
            // Get the value for the specified key from Redis
            const result = await this.get(key);
            return result; // Return the result, which may be null if the key doesn't exist
        } catch (error) {
            console.error(`Error getting key ${key}:`, error);
            return null; // Return null in case of an error
        }
    }

    /**
     * Sets a value in Redis for a given key with an expiration time.
     * This method stores the key-value pair and sets the expiration time in seconds.
     *
     * @param {string} key - The key to store in Redis.
     * @param {string|number} value - The value to store under the given key.
     * @param {number} durationInSeconds - The expiration time in seconds for the key.
     * @returns {Promise<void>} A promise that resolves when the key has been set.
     */
    async set(key, value, durationInSeconds) {
        try {
            // Correctly order the set command to match Redis expectations
            await this.set(key, value, 'EX', durationInSeconds);
        } catch (error) {
            console.error(`Error setting key ${key}:`, error);
        }
    }

    /**
     * Deletes a key-value pair from Redis.
     * This method removes the key and its associated value from Redis.
     *
     * @param {string} key - The key to remove from Redis.
     * @returns {Promise<void>} A promise that resolves when the key has been deleted.
     */
    async del(key) {
        try {
            // Delete the key from Redis
            await this.del(key);
        } catch (error) {
            console.error(`Error deleting key ${key}:`, error);
        }
    }
}

// Create an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
