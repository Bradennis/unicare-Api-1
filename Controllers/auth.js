const asyncWrapper = require("../MiddleWare/async");
const { BadRequest, Unauthenticated } = require("../CustomErrors");
const studentSchema = require("../Models/studentsApi");
const Users = require("../Models/Users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const register = asyncWrapper(async (req, res) => {
  const { username, password, email, student_id, status } = req.body;

  if (!username || !password || !email || !student_id) {
    throw new BadRequest(`please fill all the fields`);
  }

  const findStudent = await studentSchema.findOne({ id: student_id });

  if (!findStudent) {
    throw new Unauthenticated(
      "only students with valid credentials can access this service"
    );
  }

  const user = await Users.create({
    username,
    password,
    email,
    student_id,
    role: status,
  });

  const token = user.createJwt();
  res.cookie("token", token, { httpOnly: true, sameSite: "strict" });

  res.status(200).json({
    username: user.username,
    student_id: user.student_id,
    _id: user._id,
  });
});

const login = asyncWrapper(async (req, res) => {
  const { password, student_id } = req.body;

  if (!password || !student_id) {
    throw new BadRequest(`please fill all the fields`);
  }

  const user = await Users.findOne({ student_id });

  if (!user) {
    throw new Unauthenticated("invalid credentials");
  }

  const comparePassword = bcrypt.compare(password, user.password);
  if (!comparePassword) {
    throw new Unauthenticated("invalid credentials");
  }

  const token = user.createJwt();
  res.cookie("token", token, { httpOnly: true });

  res.status(200).json({
    username: user.username,
    student_id: user.student_id,
    _id: user._id,
  });
});

const logOut = asyncWrapper(async (req, res) => {
  res.clearCookie("token");

  const { _id } = req.body;

  try {
    const user = await Users.findByIdAndUpdate(
      _id,
      {
        online: false,
        lastSeen: new Date(),
        hasLoggedOut: true,
      },
      { new: true }
    );
  } catch (err) {
    console.error("Error updating last seen status:", err);
  }
  return res.send({ msg: "logged out succesful" });
});

const fetchToken = asyncWrapper(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    throw new Unauthenticated("authentication failed");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await Users.findOne({ username: decoded.username });

  if (!user) {
    throw new Unauthenticated("authentication failed");
  }

  res.status(200).json({ token });
});

const testing = asyncWrapper(async (req, res) => {
  res.status(200).send("hello world");
});
module.exports = { register, login, fetchToken, logOut, testing };
