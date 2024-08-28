const express = require("express");
const {
  getUserDetails,
  updateUserDetails,
  postResource,
  getLibraryResources,
  postComments,
  likes,
  accesss,
  removeAccessLog,
  favorites,
  getUsers,
  getAllHealthProfs,
  getDoctors,
  getCounsellors,
} = require("../Controllers/tasks");
const router = express.Router();

router.route("/userdetails").get(getUserDetails).patch(updateUserDetails);
router.route("/library/resources").post(postResource).get(getLibraryResources);
router.route("/library/resources/comments").post(postComments);
router.route("/library/resources/likes").post(likes);
router.route("/library/resources/access").post(accesss);
router.route("/library/resources/favorites").post(favorites);
router.route("/library/access/remove").post(removeAccessLog);
router.route("/getusers").get(getUsers);
router.route("/getProfs").get(getAllHealthProfs);
router.route("/getdoctors").get(getDoctors);
router.route("/getcounsellors").get(getCounsellors);

module.exports = router;
