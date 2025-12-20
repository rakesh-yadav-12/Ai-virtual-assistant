import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) throw new Error("MONGODB_URL is not set in environment");
    
    // Check mongoose version
    const mongooseVersion = mongoose.version;
    console.log(`📦 Mongoose version: ${mongooseVersion}`);
    
    // Parse version to check major version
    const majorVersion = parseInt(mongooseVersion.split('.')[0]);
    
    if (majorVersion >= 6) {
      // For mongoose v6+, remove deprecated options
      console.log("🔧 Using mongoose v6+ connection settings");
      await mongoose.connect(mongoUrl);
    } else {
      // For mongoose v5.x, keep the options
      console.log("🔧 Using mongoose v5.x connection settings");
      await mongoose.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
    
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    console.log(`🔄 Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('🟢 MongoDB connected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🟡 MongoDB disconnected');
    });
    
    // Handle app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    
    // More detailed error information
    if (error.name === 'MongoServerError') {
      console.error('🔍 MongoDB Server Error Details:', error.codeName);
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('🔍 Unable to connect to MongoDB. Check your connection string and network.');
    }
    
    process.exit(1);
  }
};

export default connectDb;