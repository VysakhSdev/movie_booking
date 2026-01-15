//--------------------------------- Movie Seat Booking System----------------------//

A high-concurrency backend system designed to manage movie show seats with 100% accuracy. This system ensures that no seat is double-booked using a hybrid strategy of Redis for atomic temporary holds and MongoDB for persistent data integrity.

//--How the System Works--//
The system follows a two-step reservation process:

Hold Step: Uses Redis to place a temporary lock on selected seats. This ensures high performance during the "selection" phase without locking database rows permanently.

Confirmation Step: Transfers the hold from Redis to a permanent record in MongoDB.

# 🚀 Key Features & Solutions

### 1. Handling Simultaneous Bookings (Race Conditions)
- **Problem:** Two users clicking "Book" on the same seat at the exact same millisecond.
- **Solution:** I implemented **Atomic Distributed Locks** using Redis `SET NX`. The `NX` flag ensures that only the first request to reach Redis succeeds in holding the seat.

### 2. Temporary Holds & Automatic Expiry
- **Problem:** Users selecting seats but closing the browser or not completing the payment.
- **Solution:** Every "Hold" has a **TTL (Time-To-Live)** of 10 minutes (`EX 600`). If the booking is not confirmed within this window, Redis automatically deletes the key, making the seats available for other users again.

### 3. Data Integrity & "Never Double Sold"
- **Problem:** Ensuring that even if the cache layer fails, the database remains accurate.
- **Solution:** The MongoDB schema uses a **Compound Unique Index** on `{ showId: 1, seatNumber: 1 }`. This is a hard safety layer at the database level that makes it physically impossible to create two booking records for the same seat.

### 4. Rollback Logic (Atomic Batch Booking)
- **Problem:** A user tries to book 3 seats (S1, S2, S3), but S2 is suddenly taken.
- **Solution:** The system uses a **Rollback mechanism**. If any seat in a requested batch fails to be held, the system automatically releases any other seats from that batch that were successfully held during that request. It’s an "All or Nothing" approach.

### 5. Idempotency & Retries
- **Problem:** Users refreshing the page or retrying a request after a network glitch.
- **Solution:** Before processing a confirmation, the system checks if a booking record already exists for that `userId` and `seatNumber`. If it does, it returns a successful "Already Booked" response rather than an error or a duplicate charge.

## 🛠 Tech Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Primary Database:** MongoDB (Persistent Bookings)
- **Cache/Locking:** Redis (Temporary Holds)

## API GuideBase
Sample Show ID: 6968c63750fc5afb14f89c46 or call Seeder  and check your console after seeding

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/status/:showId` | View live seat map (Available/Held/Booked) |
| **GET** | `/summary/:showId` | Get counts of seats by status |
| **POST** | `/hold` | Place 10-minute hold |
| **POST** | `/confirm` | Finalize booking into MongoDB |




## 🏃 How to Run

1. **Clone the repository**
2. **Install dependencies**
3. **Configure Environment**
4. **Seed the Database**
      npm Run seed
5. **Run the Server**
     npm install
