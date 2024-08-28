const mongoose = require("mongoose");
const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, default: "pending" }, // e.g., 'pending', 'confirmed', 'canceled'
  type: { type: String, required: true },
});

module.exports = mongoose.model("appointment", appointmentSchema);
