import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-health-analyzer';
    
    // Optimized connection options for performance
    const options = {
      // Connection pool settings
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 2,  // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      
      // Connection timeout settings
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      
      // Heartbeat settings
      heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
    };
    
    await mongoose.connect(mongoUri, options);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Connection pool: min=${options.minPoolSize}, max=${options.maxPoolSize}`);
    
    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName: string, method: string, query: any, doc: any) => {
        console.log(`🔍 MongoDB Query: ${collectionName}.${method}`, JSON.stringify(query));
      });
    }
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    // Monitor connection pool
    mongoose.connection.on('fullsetup', () => {
      console.log('📡 MongoDB replica set fully connected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('🔌 Closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('🔌 Closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.warn('⚠️ Server will continue without database connection');
    console.log('💡 To fix this, ensure MongoDB is running or update MONGODB_URI in .env');
    // Don't throw error in development to allow server to start
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

// Database performance monitoring
export const getDbStats = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return null;

    const stats = await db.stats();
    const serverStatus = await db.admin().serverStatus();
    
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      connections: serverStatus.connections,
      opcounters: serverStatus.opcounters,
      uptime: serverStatus.uptime
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};