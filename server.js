#!/usr/bin/env node

import express from 'express';
import startServer from './libs/boot';
import injectRoutes from './routes';
import injectMiddlewares from './libs/middleware';

const server = express();

injectMiddlewares(server);
injectRoutes(server);
startServer(server);

export default server;
