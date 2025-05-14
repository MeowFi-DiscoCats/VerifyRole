import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const { DB_CONNECTION_URL } = process.env;

if (!DB_CONNECTION_URL) {
  throw new Error("MongoDB URI is missing in .env file");
}

mongoose.connect(DB_CONNECTION_URL);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

export default mongoose;
