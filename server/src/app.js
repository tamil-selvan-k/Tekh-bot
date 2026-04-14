const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { chatRateLimiter } = require('./middlewares/rate-limit');
const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');

const app = express();

// Required when deployed behind a reverse proxy so req.ip resolves to the actual client IP.
app.set('trust proxy', env.nodeEnv === 'production');

let corsOrigin = env.clientUrl;

if (corsOrigin && corsOrigin !== '*') {
  try {
    corsOrigin = new URL(corsOrigin).origin;
  } catch (error) {
    corsOrigin = env.clientUrl;
  }
}

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tekh-bot API is running',
  });
});

app.use('/api/v1/chat', chatRateLimiter);
app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
