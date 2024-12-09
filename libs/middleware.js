import express from 'express';

/**
 * Adds middlewares to the given express application.
 * @param {express.Express} api The express application.
 * This function injects middlewares into the Express app.
 * It can include logging, error handling, security measures, etc.
 */
const injectMiddlewares = (api) => {
  api.use(express.json({ limit: '200mb' }));
};

export default injectMiddlewares;
