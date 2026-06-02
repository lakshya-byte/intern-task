import mongoose from 'mongoose';
import dns from 'dns';
import logger from './logger';

// Programmatically set DNS servers to Google and Cloudflare to bypass restricted ISP DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  let retries = 5;

  while (retries > 0) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('✅ MongoDB connected successfully', {
        host: mongoose.connection.host,
        dbName: mongoose.connection.name,
      });
      break;
    } catch (error) {
      retries -= 1;
      logger.error(`MongoDB connection failed. Retries left: ${retries}`, { error });
      if (retries === 0) {
        logger.error('Could not connect to MongoDB. Exiting...');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
};

export default connectDB;
