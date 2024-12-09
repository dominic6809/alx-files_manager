/* eslint-disable import/no-named-as-default */
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    try {
      const { user } = req;
      const token = uuidv4();

      // Store the token in Redis with a 24-hour expiration
      await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 24 * 60 * 60);

      // Respond with the generated token
      res.status(200).json({ token });
    } catch (error) {
      console.error('Error in getConnect:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(req, res) {
    try {
      const token = req.headers['x-token'];

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token from Redis (log the user out)
      await redisClient.del(`auth_${token}`);

      // Respond with no content (successful logout)
      return res.status(204).send();
    } catch (error) {
      console.error('Error in getDisconnect:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
