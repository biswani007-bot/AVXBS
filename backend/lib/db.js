import dns from 'dns';
import mongoose from 'mongoose';

// Configure reliable public DNS servers for MongoDB Atlas SRV lookup on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in environments where setServers is restricted
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Sanitizes a MongoDB URI for secure logging (masks credentials)
 */
function maskUri(uri) {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const uri = process.env.MONGODB_URI;

      if (!uri) {
        throw new Error('[DB] MONGODB_URI environment variable is not defined.');
      }

      console.log(`[DB] Connecting to MongoDB: ${maskUri(uri)}`);

      let lastErr;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          try {
            dns.setServers(['8.8.8.8', '1.1.1.1']);
          } catch (_) {}

          const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            bufferCommands: false,
          });

          console.log(`[DB] Successfully connected to MongoDB database "${conn.connection.name}" at host: ${conn.connection.host}`);
          return conn;
        } catch (err) {
          lastErr = err;
          console.warn(`[DB] MongoDB connection attempt ${attempt}/3 failed:`, err.message);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      console.error(`[DB] Connection to MongoDB failed (${maskUri(uri)}):`, lastErr.message);
      throw lastErr;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
