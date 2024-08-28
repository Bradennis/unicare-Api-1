const express = require("express");
const router = express.Router();

const {
  getAllCounsellors,
  deleteCounsellor,
} = require("./../controllers/counsellorController.js");

/*Api for fetching all doctor */
router.route("/getCounsellors").get(getAllCounsellors);

/*Api for deleting a doctor */
router.route("/deleteCounsellor/:id").delete(deleteCounsellor);
module.exports = router;
