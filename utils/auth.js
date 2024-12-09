/* eslint-disable import/no-named-as-default */
/* eslint-disable no-unused-vars */
import sha1 from 'sha1';
import { Request } from 'express';
import mongoDBCore from 'mongodb/lib/core';
import dbClient from './db';
import redisClient from './redis';

/**
 * Fetches the user from the Authorization header in the given request object.
 * This method decodes the base64 token from the 'Authorization' header,
 * then validates the user's email and password by comparing them with the database.
 * @param {Request} req The Express request object.
 * @returns {Promise<{_id: ObjectId, email: string, password: string}>} The user object if valid credentials are found, null otherwise.
 */
export const getUserFromAuthorization = async (req) => {
  // Extracts the Authorization header from the request
  const authorization = req.headers.authorization || null;

  if (!authorization) {
    return null; // Return null if the Authorization header is missing
  }
  const authorizationParts = authorization.split(' ');

  // Checks if the authorization header is in the correct format (Basic Authentication)
  if (authorizationParts.length !== 2 || authorizationParts[0] !== 'Basic') {
    return null;
  }

  // Decodes the base64 token and splits it into email and password
  const token = Buffer.from(authorizationParts[1], 'base64').toString();
  const sepPos = token.indexOf(':');
  const email = token.substring(0, sepPos);
  const password = token.substring(sepPos + 1);

  // Looks up the user by email in the database
  const user = await (await dbClient.usersCollection()).findOne({ email });

  // Verifies if the user exists and the password matches the stored hashed password
  if (!user || sha1(password) !== user.password) {
    return null; // Returns null if no match is found
  }

  return user; // Returns the user object if valid credentials are found
};

/**
 * Fetches the user from the X-Token header in the given request object.
 * This method retrieves the user ID associated with the provided X-Token
 * from the Redis cache, and if a user ID is found, it queries the database for the user.
 * @param {Request} req The Express request object.
 * @returns {Promise<{_id: ObjectId, email: string, password: string}>} The user object if the token is valid, null otherwise.
 */
export const getUserFromXToken = async (req) => {
  // Extracts the X-Token header from the request
  const token = req.headers['x-token'];

  if (!token) {
    return null; // Returns null if the X-Token header is missing
  }

  // Retrieves the user ID from the Redis cache using the token
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return null; // Returns null if no user ID is found in the cache
  }

  // Looks up the user by their ObjectId in the database
  const user = await (await dbClient.usersCollection())
    .findOne({ _id: new mongoDBCore.BSON.ObjectId(userId) });

  return user || null; // Returns the user object if found, otherwise null
};

export default {
  // Exports methods to fetch user using authorization or X-Token headers
  getUserFromAuthorization: async (req) => getUserFromAuthorization(req),
  getUserFromXToken: async (req) => getUserFromXToken(req),
};
