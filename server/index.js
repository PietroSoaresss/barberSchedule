require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const appointmentsRouter = require("./routes/appointments");

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/appointments", appointmentsRouter);

async function start() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing. Add it to .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

start();
