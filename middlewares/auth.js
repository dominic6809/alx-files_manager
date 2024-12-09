/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { getUserFromXToken, getUserFromAuthorization } from '../utils/auth';

/**
 * Middleware to authenticate a user using Basic Authentication.
 * This checks the 'Authorization' header in the request and validates
 * the user's credentials. If the user is authenticated, the user data 
 * is attached to the request object. If authentication fails, a 401 
 * Unauthorized response is sent.
 * 
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function to pass control to the next middleware.
 */
export const basicAuthenticate = async (req, res, next) => {
  // Attempt to get the user from the Authorization header using basic auth
  const user = await getUserFromAuthorization(req);

  // If user is not found or credentials are invalid, respond with 401 Unauthorized
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // If user is authenticated, attach the user data to the request object for further use
  req.user = user;

  // Proceed to the next middleware or route handler
  next();
};

/**
 * Middleware to authenticate a user using an X-Token.
 * This checks the 'X-Token' header in the request and retrieves the 
 * associated user from Redis. If the token is valid, the user data is 
 * attached to the request object. If the token is invalid or not found, 
 * a 401 Unauthorized response is sent.
 * 
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function to pass control to the next middleware.
 */
export const xTokenAuthenticate = async (req, res, next) => {
  // Attempt to get the user based on the X-Token header (stored in Redis)
  const user = await getUserFromXToken(req);

  // If user is not found or token is invalid, respond with 401 Unauthorized
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // If user is authenticated, attach the user data to the request object for further use
  req.user = user;

  // Proceed to the next middleware or route handler
  next();
};
