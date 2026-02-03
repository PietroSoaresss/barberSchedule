const express = require("express");
const Appointment = require("../models/Appointment");

const router = express.Router();

const SERVICE_TYPES = [
  "Corte de cabelo",
  "Corte + barba",
  "Corte + barba + sobrancelha"
];

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30"
];

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function todayIso() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isValidMonth(month) {
  return /^\d{4}-\d{2}$/.test(month);
}

router.get("/", async (req, res) => {
  try {
    const query = {};
    const { date, month } = req.query;

    if (date) {
      if (!isValidDate(date)) {
        return res.status(400).json({ error: "Invalid date" });
      }
      query.date = date;
    }

    if (month) {
      if (!isValidMonth(month)) {
        return res.status(400).json({ error: "Invalid month" });
      }
      const start = `${month}-01`;
      const end = `${month}-31`;
      query.date = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(query).sort({ date: 1, timeSlot: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.get("/meta/options", (req, res) => {
  res.json({ serviceTypes: SERVICE_TYPES, timeSlots: TIME_SLOTS });
});

router.get("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: "Invalid appointment id" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { clientName, serviceType, date, timeSlot } = req.body;
    if (!clientName || !serviceType || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!SERVICE_TYPES.includes(serviceType)) {
      return res.status(400).json({ error: "Invalid service type" });
    }
    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({ error: "Invalid time slot" });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ error: "Invalid date" });
    }
    if (date < todayIso()) {
      return res.status(400).json({ error: "Past dates not allowed" });
    }

    const existing = await Appointment.findOne({ date, timeSlot });
    if (existing) {
      return res.status(409).json({ error: "Time slot unavailable" });
    }

    const appointment = await Appointment.create({
      clientName,
      serviceType,
      date,
      timeSlot
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: "Invalid appointment data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { clientName, serviceType, date, timeSlot } = req.body;
    if (!clientName || !serviceType || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!SERVICE_TYPES.includes(serviceType)) {
      return res.status(400).json({ error: "Invalid service type" });
    }
    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({ error: "Invalid time slot" });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ error: "Invalid date" });
    }
    if (date < todayIso()) {
      return res.status(400).json({ error: "Past dates not allowed" });
    }

    const conflict = await Appointment.findOne({
      date,
      timeSlot,
      _id: { $ne: req.params.id }
    });
    if (conflict) {
      return res.status(409).json({ error: "Time slot unavailable" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { clientName, serviceType, date, timeSlot },
      { new: true, runValidators: true }
    );

    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: "Invalid appointment data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "Invalid appointment id" });
  }
});

module.exports = router;
