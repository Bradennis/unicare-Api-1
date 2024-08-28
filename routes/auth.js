const express = require("express");
const router = express.Router();
const {
  registerUser,
  login,
  forgotPassword,
  getUserInfoById,
  markAllNotificationsAsSeen,
  deleteAllNotifications,
} = require("../Controllers/authController.js");
const multer = require("multer");
const path = require("path");

const middleware = require("../MiddleWare/StudentAuthMiddleWare.js");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/profImages");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

// router.post("/createPersonnel", upload.single("picture"), createPersonnel());
router.route("/registerUser").post(upload.single("picture"), registerUser);
router.route("/login").post(login);
router.route("/reset-password").post(forgotPassword);
router.route("/getDataByID").post(middleware, getUserInfoById);
router
  .route("/mark-all-notifications-as-seen")
  .post(markAllNotificationsAsSeen);
router.route("/delete-all-notifications").post(deleteAllNotifications);

module.exports = router;
