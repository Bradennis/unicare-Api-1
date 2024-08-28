const express = require("express");
const router = express.Router();
const {
  bookAppointment,
  checkAvailability,
  getPendingAppointments,
  getAppointments,
} = require("../Controllers/appointments");

router.post("/book", bookAppointment);
router.post("/check-availability", checkAvailability);
router.get("/pending", getPendingAppointments);
router.get("/appointments", getAppointments);

module.exports = router;
