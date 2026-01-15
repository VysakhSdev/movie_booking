import { Schema, model, Document } from 'mongoose';

interface IShow extends Document {
  movieTitle: string;
  startTime: Date;
  totalSeats: number;
}

const showSchema = new Schema<IShow>({
  movieTitle: { 
    type: String, 
    required: [true, 'Movie title is required'],
    trim: true 
  },
  startTime: { 
    type: Date, 
    required: [true, 'Show start time is required'] 
  },
  totalSeats: { 
    type: Number, 
    required: [true, 'Total seat count is required'],
    min: 1 
  }
}, { timestamps: true });

export const Show = model<IShow>('Show', showSchema);