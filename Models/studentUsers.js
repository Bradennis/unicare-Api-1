const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const studentUsersSchema = new mongoose.Schema({
  username: {
    type: String,
    maxLength: [30, "user name cannot be more than 30 characters"],
    required: true,
  },
  student_id: {
    type: String,
    maxLength: [8, "students id can't be more than 8 characters"],
  },
  email: {
    type: String,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ],
    unique: true,
  },
  password: {
    type: String,
    minLength: [4, "your password is too weak"],
  },
  img: {
    type: String,
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
});

studentUsersSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

studentUsersSchema.methods.createJwt = function () {
  return jwt.sign(
    { userId: this.student_id, username: this.username, id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

module.exports = mongoose.model("studentUsers", studentUsersSchema);
