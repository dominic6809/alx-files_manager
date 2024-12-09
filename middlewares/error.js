/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class to represent API-specific errors.
 * This class extends the native JavaScript Error class and allows us 
 * to create errors with a custom status code and message.
 * 
 * @param {number} code The HTTP status code to be associated with the error (default is 500).
 * @param {string} message The message describing the error.
 */
export class APIError extends Error {
  constructor(code, message) {
    super(); // Call the parent constructor (Error)
    this.code = code || 500; // Set the error code, default to 500 if not provided
    this.message = message; // Set the error message
  }
}

/**
 * Express middleware to handle and format error responses.
 * This function processes errors thrown in the application and sends 
 * an appropriate HTTP response to the client.
 * 
 * If the error is an instance of APIError, it sends the error code and message.
 * Otherwise, it defaults to a 500 error with a generic message.
 * 
 * @param {Error} err The error object (either an APIError or a generic error).
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function to pass control to the next middleware.
 */
export const errorResponse = (err, req, res, next) => {
  // Default error message if no specific message is provided
  const defaultMsg = `Failed to process ${req.url}`;

  // Check if the error is an instance of the custom APIError
  if (err instanceof APIError) {
    // Send the custom error response with the error code and message
    res.status(err.code).json({ error: err.message || defaultMsg });
    return;
  }

  // If it's not an APIError, send a generic 500 Internal Server Error response
  res.status(500).json({
    error: err ? err.message || err.toString() : defaultMsg,
  });
};
