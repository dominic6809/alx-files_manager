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
    this.client = createClient();
    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.error('Redis client failed to connect:', err.message || err.toString());
      this.isClientConnected = false;
    });
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
     * Checks whether the Redis client is connected and alive.
     * Returns true if connected, otherwise false.
     *
     * @returns {boolean} true if Redis is connected, false otherwise
     */
  isAlive() {
    return this.isClientConnected;
  }

  /**
     * Retrieves a value from Redis for a given key.
     * Uses the promisified Redis 'get' method to return a value or null if an error occurs.
     *
     * @param {string} key - The key for which to retrieve the value.
     * @returns {Promise<string|null>} The value associated with the key, or null if not found.
     */
  async get(key) {
    return promisify(this.client.GET).bind(this.client)(key);
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
  async set(key, value, duration) {
    await promisify(this.client.SETEX)
      .bind(this.client)(key, duration, value);
  }

  /**
     * Deletes a key-value pair from Redis.
     * This method removes the key and its associated value from Redis.
     *
     * @param {string} key - The key to remove from Redis.
     * @returns {Promise<void>} A promise that resolves when the key has been deleted.
     */
  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

// Create an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
