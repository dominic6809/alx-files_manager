import envLoader from '../utils/env_loader';

/**
 * This function will initialize the server by setting the correct port
 * and logging when the server is up and running.
 */
const startServer = (api) => {
  envLoader();
  const port = process.env.PORT || 5000;
  const env = process.env.npm_lifecycle_event || 'dev';
  api.listen(port, () => {
    console.log(`[${env}] API has started listening at port:${port}`);
  });
};

export default startServer;
