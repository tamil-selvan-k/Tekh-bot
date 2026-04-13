const http = require('http');

const app = require('./app');
const env = require('./config/env');

const server = http.createServer(app);

server.listen(env.port, () => {
  console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing server...`);
  server.close(() => {
    console.log('Server closed successfully.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
