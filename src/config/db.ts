import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/movie_booking';
    await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected`);
  } catch (error) {
    console.error(`MongoDB Error: ${error}`);
    process.exit(1);
  }
};