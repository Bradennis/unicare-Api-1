const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    maxLength: [20, "user name cannot be more than 30 characters"],
  },
  student_id: {
    type: String,
    maxLength: [8, "students id can't be more than 8 characters"],
  },
  lastSeen: {
    type: Date,
    default: new Date(),
  },
  online: {
    type: Boolean,
    default: false,
  },
  hasLoggedOut: {
    type: Boolean,
  },

  email: { type: String, unique: true },
  password: { type: String, required: true, unique: true },
  first_name: String,
  last_name: String,
  number: String,
  img: String,
  role: String,
  seenNotifications: {
    type: Array,
    default: [],
  },
  unSeenNotifications: {
    type: Array,
    default: [],
  },
  specialization: {
    type: String,
  },
  timings: {
    type: Array,
  },
});

UserSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.createJwt = function () {
  return jwt.sign(
    { userId: this.student_id, username: this.username, id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

module.exports = mongoose.model("User", UserSchema);
