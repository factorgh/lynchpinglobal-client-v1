import dns from "node:dns";
import mongoose from "mongoose";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (err: any) {
  console.warn("Could not set DNS servers:", err?.message);
}

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
  // eslint-disable-next-line no-var
  var cronsInitialized: boolean | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      console.log("MongoDB connected successfully");
      if (!global.cronsInitialized && typeof window === "undefined") {
        global.cronsInitialized = true;
        try {
          const { default: dailyAccruedReturnJob } = await import("@/server/utils/schedule_cron_jobs.js");
          const { default: dailyLoanDeductions } = await import("@/server/utils/loan-cron.js");
          const { default: dailyRentalUpdates } = await import("@/server/utils/rental-cron.js");
          dailyAccruedReturnJob();
          dailyLoanDeductions();
          dailyRentalUpdates();
          console.log("[Cron Engine] Daily background cron jobs (Accruals, Loans, Rentals) initialized for 4:00 PM.");
        } catch (cronErr: any) {
          console.warn("[Cron Engine] Background cron jobs initialization warning:", cronErr?.message);
        }
      }
      return mongooseInstance;
    });
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
