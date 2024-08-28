const express = require("express");
const {
  register,
  login,
  fetchToken,
  logOut,
  testing,
} = require("../Controllers/auth");
const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/gettoken").get(fetchToken);
router.route("/logout").post(logOut);
router.route("/test").get(testing);
module.exports = router;
