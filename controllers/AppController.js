#!/usr/bin/env node

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
    /**
     * GET /status endpoint
     * Checks the status of Redis and the DB and returns a JSON response with their status.
     */
    static async getStatus(req, res) {
        try {
            // Check Redis and DB status
            const redisStatus = redisClient.ping() === 'PONG';
            const dbStatus = dbClient.isAlive();

            // Respond with the status
            res.status(200).json({ redis: redisStatus, db: dbStatus });
        } catch (error) {
            console.error('Error checking status:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * GET /stats endpoint
     * Returns the number of users and files in the database.
     */
    static async getStats(req, res) {
        try {
            // Get user and file counts
            const users = await dbClient.nbUsers();
            const files = await dbClient.nbFiles();

            // Respond with the statistics
            res.status(200).json({ users, files });
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default AppController;
