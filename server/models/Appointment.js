const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    serviceType: {
      type: String,
      required: true,
      enum: ["Corte de cabelo", "Corte + barba", "Corte + barba + sobrancelha"]
    },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true }
  },
  { timestamps: true }
);

AppointmentSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", AppointmentSchema);
