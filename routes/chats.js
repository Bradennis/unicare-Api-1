const express = require("express");
const {
  accessSingleChat,
  sendMessage,
  chatParticipant,
} = require("../Controllers/chats");
const router = express.Router();

router.route("/").post(accessSingleChat);
router.route("/send").post(sendMessage);

module.exports = router;
