const Appointment = require("../Models/Appointment");
const User = require("../Models/Users");
const studentApi = require("../Models/studentsApi");
const asyncWrapper = require("../MiddleWare/async");

const bookAppointment = asyncWrapper(async (req, res) => {
  const { doctorId, date, time, type } = req.body;
  const userId = req.user.id;

  // Find student details from studentUsers model
  const findStudent = await User.findOne({ _id: userId });

  // Find full name and additional info from studentsApi model
  const findStudentFullName = await studentApi.findOne({
    id: findStudent.student_id,
  });

  const isAvailable = await checkTimeSlotAvailability(doctorId, date, time);
  if (!isAvailable) {
    return res.status(409).json({
      message: "The requested time slot overlaps with an existing appointment.",
    });
  }

  // Create the new appointment with student details
  const newAppointment = new Appointment({
    doctorId,
    userId,
    date,
    time,
    type,
    studentDetails: {
      name: `${findStudentFullName.other_names} ${findStudentFullName.surname}`,
      email: findStudent.email,
      contact: findStudentFullName.contact,
      img: findStudent.img,
    },
  });

  await newAppointment.save();

  // Create the notification object
  const notification = {
    message: `You have a new appointment request for ${date} at ${time} with ${findStudentFullName.other_names} ${findStudentFullName.surname}.`,
    type: "appointment_request",
    data: {
      appointmentId: newAppointment._id,
      date,
      time,
      studentId: userId,
      appointmentType: type,
    },
    createdAt: new Date(),
  };

  // Update the doctor's unSeenNotifications array
  await User.findByIdAndUpdate(doctorId, {
    $push: { unSeenNotifications: notification },
  });

  const doctor = await User.findOne({ _id: doctorId });
  const appointmentData = {
    img: doctor.picture,
    name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
    specialization: doctor.specialization,
    date: newAppointment.date,
    time: newAppointment.time,
    status: newAppointment.status,
    type: newAppointment.type,
  };

  res
    .status(201)
    .json({ appointmentData, message: "Appointment booked successfully!" });
});

const checkAvailability = asyncWrapper(async (req, res) => {
  const { doctorId, date, time } = req.body;

  const isAvailable = await checkTimeSlotAvailability(doctorId, date, time);
  if (!isAvailable) {
    return res.status(409).json({
      message: "The requested time slot overlaps with an existing appointment.",
    });
  }

  res.status(200).json({ message: "Time slot is available." });
});

const checkTimeSlotAvailability = async (doctorId, date, time) => {
  const requestedDateTime = new Date(`${date}T${time}`);

  if (isNaN(requestedDateTime.getTime())) {
    throw new Error("Invalid date or time format.");
  }

  // Ensure the requested time is not in the past if the date is today
  const currentDateTime = new Date();
  if (
    requestedDateTime < currentDateTime &&
    date === currentDateTime.toISOString().split("T")[0]
  ) {
    return false;
  }

  // Fetch the doctor's timings from the database
  const doctor = await User.findById(doctorId);

  if (!doctor) {
    throw new Error("Doctor not found.");
  }

  const [startHour, startMinute] = doctor.timings[0].split(":").map(Number);
  const [endHour, endMinute] = doctor.timings[1].split(":").map(Number);

  const startTime = new Date(requestedDateTime);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(requestedDateTime);
  endTime.setHours(endHour, endMinute, 0, 0);

  // // Check if the requested time is within the doctor's available timings
  // if (requestedDateTime < startTime || requestedDateTime >= endTime) {
  //   return false;
  // }

  const oneHourBefore = new Date(requestedDateTime.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(requestedDateTime.getTime() + 60 * 60 * 1000);

  // Check for conflicting "approved" appointments within the one-hour window
  const conflictingAppointment = await Appointment.findOne({
    doctorId,
    date,
    time: {
      $gte: oneHourBefore.toISOString().split("T")[1].slice(0, 5),
      $lt: oneHourAfter.toISOString().split("T")[1].slice(0, 5),
    },
    status: "approved", // Ensure only approved appointments are considered
  });

  return !conflictingAppointment;
};

const getPendingAppointments = asyncWrapper(async (req, res) => {
  const userId = req.user.id; // Get the student user ID from the request object

  // Fetch all pending appointments for the student user
  const pendingAppointments = await Appointment.find({
    userId,
    status: "pending",
  }).populate("doctorId", "img first_name last_name specialization");

  // Map over the appointments to include additional doctor information
  const appointmentsWithDoctorInfo = pendingAppointments.map((appointment) => ({
    img: appointment.doctorId.img,
    name: `Dr. ${appointment.doctorId.first_name} ${appointment.doctorId.last_name}`,
    specialization: appointment.doctorId.specialization,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    type: appointment.type,
  }));

  res.status(200).json({
    appointments: appointmentsWithDoctorInfo,
    message: "Fetched pending appointments successfully!",
  });
});

const getAppointments = asyncWrapper(async (req, res) => {
  const userId = req.user.id;

  // Fetch all appointments for the user that are not pending
  const nonPendingAppointments = await Appointment.find({
    userId,
    status: { $ne: "pending" }, // $ne operator filters out appointments with status "pending"
  }).populate("doctorId", "img first_name last_name specialization"); // Populate doctor details

  // Map over the appointments to include additional doctor information
  const appointmentsWithDoctorInfo = nonPendingAppointments.map(
    (appointment) => ({
      img: appointment.doctorId.img,
      name: `Dr. ${appointment.doctorId.first_name} ${appointment.doctorId.last_name}`,
      specialization: appointment.doctorId.specialization,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      type: appointment.type,
    })
  );

  res.status(200).json({
    appointments: appointmentsWithDoctorInfo,
    message: "Fetched non-pending appointments successfully!",
  });
});

module.exports = {
  bookAppointment,
  checkAvailability,
  getPendingAppointments,
  getAppointments,
};
