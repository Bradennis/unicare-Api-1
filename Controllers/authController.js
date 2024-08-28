const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../Models/Users.js");

const registerUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      number,
      role,
      password,
      speciality,
      timings,
    } = req.body;

    if (!first_name) {
      return res
        .status(200)
        .json({ status: false, message: "Enter first name." });
    }
    if (!last_name) {
      return res
        .status(200)
        .json({ status: false, message: "Enter last name." });
    }
    if (!email) {
      return res.status(200).json({ status: false, message: "Enter email" });
    }
    if (!password) {
      return res
        .status(200)
        .json({ status: false, message: "Password is required" });
    }
    if (!speciality) {
      return res
        .status(200)
        .json({ status: false, message: "Enter speciality" });
    }
    if (!number) {
      return res
        .status(200)
        .json({ status: false, message: "Enter phone number." });
    }

    const picture = req.file ? req.file.filename : null;

    const user = await User.findOne({ email });
    if (user) {
      return res.status(200).json({
        message: "User with this email already exists",
        status: false,
      });
    }

    const splitTimings = (timingsString) => {
      if (timingsString && typeof timingsString === "string") {
        return timingsString.split(",");
      }
      return [];
    };
    const timeRange = splitTimings(timings);
    const userRole = role;
    const username = `Dr ${first_name} ${last_name}`;

    // const hashpassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      first_name,
      number,
      email,
      img: picture,
      last_name,
      role,
      password,
      timings: timeRange,
      specialization: speciality,
      username,
    });

    await newUser.save();

    const savedUser = await User.findOne({ email });

    if (!savedUser) {
      return res
        .status(500)
        .json({ status: false, message: "User creation failed." });
    }

    const token = savedUser.createJwt();

    res.cookie("token", token, { httpOnly: true, sameSite: "strict" });
    return res
      .status(200)
      .json({ status: true, message: "User Added Successfully", userRole });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: false, message: "Error adding user", error });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!email) {
      return res.status(200).json({ status: false, message: "Enter email" });
    }
    if (!password) {
      return res.status(200).json({ status: false, message: "Enter password" });
    }
    if (!email && !password) {
      return res
        .status(200)
        .json({ status: false, message: "Enter email and password" });
    }
    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User does not exist." });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(200)
        .json({ status: false, message: "Incorrect password" });
    }

    // const token = jwt.sign({ id: user._id }, process.env.KEY, {
    //   expiresIn: "1d",
    // });
    const token = user.createJwt();
    res.cookie("token", token, { httpOnly: true });
    const userId = user._id;
    // res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
    return res
      .status(200)
      .json({ status: true, message: "Login Successful", data: token, userId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Error logging in", error });
  }
};

const forgotPassword = async (req, res) => {
  // const { email } = req.body;
  // try {
  //   const user = await User.findOne({ email });
  //   if (!user) {
  //     return res.status(200).json({
  //       message: "There is no user with this email address",
  //       status: false,
  //     });
  //   }
  //   const resetToken = user.createPasswordResetToken();
  //   await user.save({ validateBeforeSave: false });
  //   const resetURL = `${req.protocol}://${req.get(
  //     "host"
  //   )}/api/auth/reset-password/${resetToken}`;
  //   const message = Forgot your password?\n Clik this link to change it.${resetURL}.\nIf you didn't forget your password, please ignore this email.;
  //   await sendEmail({
  //     email: user.email,
  //     subject: "Password reset token (Valid for 10 min)",
  //     message,
  //   });
  //   res.status(200).json({
  //     status: true,
  //     message: "Check your inbox for reset link",
  //   });
  // } catch (error) {
  //   res
  //     .status(500)
  //     .json({ status: false, message: "Error sending reset email", error });
  // }
};

const getUserInfoById = async (req, res) => {
  console.log(req.user);
  try {
    const user = await User.findOne({ _id: req.user.id });
    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User does not exist." });
    } else {
      return res.status(200).json({
        status: true,
        data: {
          name: user.first_name,
          email: user.email,
          role: user.role,
          unSeenNotifications: user.unSeenNotifications,
          seenNotifications: user.seenNotifications,
          id: user._id,
        },
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ status: false, message: "Error getting user details", error });
  }
};
const markAllNotificationsAsSeen = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.id });
    const seenNotifications = user.seenNotifications;
    const unSeenNotifications = user.unSeenNotifications;
    seenNotifications.push(...unSeenNotifications);
    user.unSeenNotifications = [];
    user.seenNotifications = seenNotifications;
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    return res.status(200).json({
      status: true,
      message: "All notifications marked as read,",
      data: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Error marking all as seen.", error });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.id });
    user.seenNotifications = [];
    user.unSeenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    return res.status(200).json({
      status: true,
      message: "All notifications deleted,",
      data: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Error marking all as seen.", error });
  }
};

module.exports = {
  deleteAllNotifications,
  markAllNotificationsAsSeen,
  getUserInfoById,
  login,
  registerUser,
  forgotPassword,
};
