import { Router } from 'express';
import { holdSeat, confirmBooking, getSeatMap, getShowSummary } from '../controllers/bookingController.js';

const router = Router();

// Get the status of all seats for a specific show
router.get('/status/:showId', getSeatMap);

// Hold a seat (Redis)
router.post('/hold', holdSeat);

// Confirm booking (Mongo)
router.post('/confirm', confirmBooking);

//summary route
router.get('/summary/:showId', getShowSummary);

export default router;