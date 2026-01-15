import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Show } from './models/Shows.js';

dotenv.config();

export const seedDatabase = async () => {
    try {
        // Connect to MongoDB (Update the URI if needed)
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("🌱 Connecting to database for seeding...");

        // Clear existing shows to start fresh (Optional)
        await Show.deleteMany({});

        const newShow = await Show.create({
            movieTitle: "Interstellar",
            startTime: new Date(Date.now() + 86400000), // Tomorrow
            totalSeats: 100
        });

        console.log("✅ Seed Success!");
        console.log("-------------------------");
        console.log(`🎬 Movie: ${newShow.movieTitle}`);
        console.log(`🆔 SHOW ID: ${newShow._id}`);
        console.log("-------------------------");
        console.log("Use this SHOW ID in your Postman requests.");

        process.exit();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
