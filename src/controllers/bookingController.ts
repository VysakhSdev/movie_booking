import type { Request, Response } from "express";
import { redisClient } from "../config/redis.js";
import { Booking } from "../models/Booking.js";
import { Show } from "../models/Shows.js";

// API 1: Get the seat map for a specific show
export const getSeatMap = async (req: Request, res: Response) => {
  const { showId } = req.params;
  if (!showId || typeof showId !== "string") {
    return res.status(400).json({ message: "A valid Show ID is required" });
  }

  try {
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    const bookedDocs = await Booking.find({ showId }).select("seatNumber");
    const bookedSeatNumbers = new Set(bookedDocs.map((b) => b.seatNumber));

    const allKeys = await redisClient.keys("*");
    console.log("All keys in Redis:", allKeys);

    const holdKeys = await redisClient.keys(`hold:${showId}:*`);

    const heldSeatNumbers = new Set(
      holdKeys.map((key) => key.split(":").pop())
    );

    // Generate the virtual seat map
    const seatMap = [];
    for (let i = 1; i <= show.totalSeats; i++) {
      const seatId = `S${i}`; // Example: S1, S2...
      let status = "available";

      if (bookedSeatNumbers.has(seatId)) {
        status = "booked";
      } else if (heldSeatNumbers.has(seatId)) {
        status = "held";
      }

      seatMap.push({
        seatNumber: seatId,
        status: status,
      });
    }

    res.status(200).json({
      showTitle: show.movieTitle,
      totalSeats: show.totalSeats,
      seats: seatMap,
    });
  } catch (error) {
    console.error("Error fetching seat map:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API 2: Hold a seat (using Redis)

export const holdSeat = async (req: Request, res: Response) => {
  const { showId, seatNumber, userId } = req.body;

  if (!showId || !seatNumber || !userId) {
    return res.status(400).json({
      message: "Unable to proceed. Missing show, seat, or user information.",
    });
  }

  try {
    const seatNumbers = Array.isArray(seatNumber) ? seatNumber : [seatNumber];

    const alreadyBooked = await Booking.findOne({
      showId,
      seatNumber: { $in: seatNumbers },
    });

    if (alreadyBooked) {
      return res.status(400).json({
        message: `Sorry, seat ${alreadyBooked.seatNumber} has just been sold. Please select another seat.`,
      });
    }

    const multi = redisClient.multi();
    seatNumbers.forEach((seat: string) => {
      multi.set(`hold:${showId}:${seat}`, userId, { NX: true, EX: 600 });
    });

    const results = await multi.exec();
    const failedIndex = results.findIndex((res) => res === null);

    if (failedIndex !== -1) {
      // Rollback partial holds
      for (const seat of seatNumbers) {
        const lockKey = `hold:${showId}:${seat}`;
        const owner = await redisClient.get(lockKey);
        if (owner === userId) await redisClient.del(lockKey);
      }

      return res.status(409).json({
        message:
          "One of your selected seats is currently being held by another user. Please try again in a moment.",
      });
    }

    res.status(200).json({
      message: `Success! ${seatNumbers.length} seat(s) are reserved for you for 10 minutes. Please complete your booking.`,
    });
  } catch (error) {
    console.error("Hold Seat Error:", error);
    res.status(500).json({
      message:
        "We encountered an error while holding your seats. Please try again.",
    });
  }
};

// API 3: Confirm booking (persist in MongoDB)
export const confirmBooking = async (req: Request, res: Response) => {
  const { showId, seatNumber, userId } = req.body;

  try {
    const seatNumbers = Array.isArray(seatNumber) ? seatNumber : [seatNumber];

    const alreadyBooked = await Booking.find({
      showId,
      seatNumber: { $in: seatNumbers },
    });

    if (alreadyBooked.length > 0) {
      const isSameUser = alreadyBooked.every((b) => b.userId === userId);
      if (isSameUser && alreadyBooked.length === seatNumbers.length) {
        return res.status(200).json({
          message: "Your booking is already confirmed. Enjoy your movie!",
        });
      }
      return res.status(400).json({
        message: " Selected seats have already been purchased by someone else.",
      });
    }

    for (const seat of seatNumbers) {
      const heldBy = await redisClient.get(`hold:${showId}:${seat}`);

      if (!heldBy) {
        return res.status(410).json({
          message: `Your session for seat ${seat} has expired. Please select your seats again.`,
        });
      }
      if (heldBy !== userId) {
        return res
          .status(403)
          .json({ message: `Seat ${seat} is no longer reserved for you.` });
      }
    }

    const bookingData = seatNumbers.map((seat: string) => ({
      showId,
      seatNumber: seat,
      userId,
    }));

    await Booking.insertMany(bookingData);

    for (const seat of seatNumbers) {
      await redisClient.del(`hold:${showId}:${seat}`);
    }

    res
      .status(201)
      .json({ message: "Booking confirmed! Your tickets are ready." });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Payment failed: This seat was just purchased by another customer.",
      });
    }
    console.error("Confirm Booking Error:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// API 4: Get show summary
export const getShowSummary = async (req: Request, res: Response) => {
  const { showId } = req.params;
  if (!showId || typeof showId !== "string") {
    return res.status(400).json({ message: "A valid Show ID is required" });
  }

  try {
    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: "Show not found" });

    const bookedCount = await Booking.countDocuments({ showId });

    const holdKeys = await redisClient.keys(`hold:${showId}:*`);
    const heldCount = holdKeys.length;

    const availableCount = show.totalSeats - (bookedCount + heldCount);

    res.status(200).json({
      movieTitle: show.movieTitle,
      totalSeats: show.totalSeats,
      bookedCount,
      heldCount,
      availableCount,
      message:
        "Seats not completed within 10 minutes automatically return to 'available' status.",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
