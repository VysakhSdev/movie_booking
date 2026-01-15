import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectRedis } from "./config/redis.js";
import { connectDB } from "./config/db.js";

import bookingRoutes from "./routes/bookingRoutes.js";

dotenv.config();
const app: Application = express();

app.use(cors());
app.use(express.json());


// Routes
app.use("/api/bookings", bookingRoutes);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`
Server started successfully!
Listening on port: ${PORT}
Environment: ${process.env.NODE_ENV || "development"}
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
