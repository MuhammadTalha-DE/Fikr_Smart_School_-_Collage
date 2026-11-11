const dotenv = require('dotenv');
const http = require('http');
const mongoose = require('mongoose');

dotenv.config();

const { createApp } = require('./app');
const { initSocket } = require('./socket/socketServer');
const { startScheduler } = require('./services/periodScheduler');
const weatherCron = require('./cron/weatherCron');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('\nERROR: MONGO_URI is not defined in .env file');
    console.error('Create a .env file with MONGO_URI=mongodb://localhost:27017/school_management\n');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}\n`);
  } catch (error) {
    console.error('\nMongoDB connection failed');
    console.error(`Error: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure MongoDB is installed and running.');
    console.error('2. Check MONGO_URI in .env.');
    console.error('3. If using Atlas, verify network access and credentials.\n');
    process.exit(1);
  }
};

const startServer = async () => {
  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);

  await connectDB();

  startScheduler();
  weatherCron.startAll();

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\nServer running on http://localhost:${PORT}`);
    console.log(`API base: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Frontend: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    console.log(`FikrFace service: ${process.env.FACE_SERVICE_URL || 'http://localhost:5001'}`);
    console.log('Weather cron: active\n');
  });

  return server;
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

if (require.main === module) {
  startServer();
}

module.exports = { connectDB, startServer };
