import { Schema, model } from 'mongoose';


const bookingSchema = new Schema({
  showId: { type: Schema.Types.ObjectId, ref: 'Show', required: true },
  seatNumber: { type: String, required: true }, 
  userId: { type: String, required: true },    
}, { timestamps: true });


bookingSchema.index({ showId: 1, seatNumber: 1 }, { unique: true });

export const Booking = model('Booking', bookingSchema);