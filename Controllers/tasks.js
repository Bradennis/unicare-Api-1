const asyncWrapper = require("../MiddleWare/async");
const ChatModel = require("../Models/ChatModel");
const LibraryApi = require("../Models/LibraryApi");
const studentsApi = require("../Models/studentsApi");

const Users = require("../Models/Users");

// get all the doctors and counsellors in the system
const getAllHealthProfs = asyncWrapper(async (req, res) => {
  const searchQuery = req.query.search || "";
  const profsList = await Users.find({
    first_name: { $regex: searchQuery, $options: "i" },
  });

  res.status(200).json(profsList);
});

// get only counsellors
const getCounsellors = asyncWrapper(async (req, res) => {
  const searchQuery = req.query.search || "";

  const counsellors = await Users.find({
    role: "counsellor",
    first_name: { $regex: searchQuery, $options: "i" },
  });

  res.status(200).json(counsellors);
});

// get only doctors
const getDoctors = asyncWrapper(async (req, res) => {
  const searchQuery = req.query.search || "";

  const doctors = await Users.find({
    role: "doctor",
    first_name: { $regex: searchQuery, $options: "i" },
  });

  res.status(200).json(doctors);
});

// getting all the users in the system except the currentUser
const getUsers = asyncWrapper(async (req, res) => {
  const userid = req.user.id;
  const searchQuery = req.query.search || "";

  const users = await Users.find({
    _id: { $ne: userid },
    // role: { $ne: "student" },
    username: { $regex: searchQuery, $options: "i" },
  });

  res.status(200).json(users);
});

// getting and updating user profile for the profile management page
const getUserDetails = asyncWrapper(async (req, res) => {
  const userid = req.user.userId;

  const fetchDetails = await studentsApi.findOne({ id: userid });

  const details = await Users.findOne({ student_id: userid });

  res.status(200).json({
    fetchDetails,
    username: details.username,
    img: details.img,
    _id: details._id,
  });
});

// update the details immediately
const updateUserDetails = asyncWrapper(async (req, res) => {
  const userid = req.user.userId;

  const {
    username,
    schoolVoda,
    email,
    contact,
    country,
    region,
    postalAddress,
    residentialAddress,
    img,
  } = req.body;

  const currentDetails = await studentsApi.findOne({ id: userid });

  const updatedUser = await studentsApi.findOneAndUpdate(
    { id: userid },
    {
      school_vodafone_number:
        schoolVoda || currentDetails.school_vodafone_number,
      email: email || currentDetails.email,
      contact: contact || currentDetails.contact,
      country: country || currentDetails.country,
      region: region || currentDetails.region,
      postal_address: postalAddress || currentDetails.postal_address,
      residential_address:
        residentialAddress || currentDetails.residential_address,
    },
    { new: true }
  );

  // updating for the username
  let updateUsername;
  if (
    username !== undefined &&
    username.trim() !== "" &&
    img !== undefined &&
    img.trim() !== ""
  ) {
    updateUsername = await Users.findOneAndUpdate(
      { student_id: userid },
      { username: username, img: img },
      { new: true }
    );
  } else {
    updateUsername = await Users.findOne({ student_id: userid });
  }

  // updating the library resources profile images
  const userLibraryResources = await LibraryApi.find({
    createdBy: req.user.id,
  });
  const updatePromises = userLibraryResources.map((resource) =>
    LibraryApi.findByIdAndUpdate(resource._id, { prof: img }, { new: true })
  );
  await Promise.all(updatePromises);

  // Update profile image and username in ChatModel
  await ChatModel.updateMany(
    { "messages.sender": req.user.id },
    {
      $set: {
        "messages.$[elem].senderImg": img,
        "messages.$[elem].senderUsername": username,
      },
    },
    {
      arrayFilters: [{ "elem.sender": req.user.id }],
      new: true,
    }
  );

  res.status(201).json({
    fetchDetails: updatedUser,
    username: updateUsername.username,
    img: updateUsername.img,
    id: userid,
  });
});

// uploading and updating the user profile image
const uploadFile = asyncWrapper(async (req, res) => {
  const userid = req.user.userId;
  const imgToUpdate = req.file.filename;

  const findUser = await Users.findOneAndUpdate(
    {
      student_id: userid,
    },
    { img: imgToUpdate },
    { new: true }
  );

  res.send(findUser);
});

// Library side operations
const postResource = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const likes = 0;
  const getPoster = await Users.findOne({ _id: userId });

  const { img, vid, pdf, aud, title, catClick, desc } = req.body;
  const postResource = await LibraryApi.create({
    img,
    prof: getPoster.img,
    vid,
    pdf,
    audio: aud,
    author: getPoster.username,
    title,
    desc,
    likes,
    createdBy: userId,
    category: catClick,
  });
  res.status(200).json({
    postResource,
  });
});

// get library resources
const getLibraryResources = asyncWrapper(async (req, res) => {
  const userId = req.user.id;

  // user's only files here
  const usersFiles = await LibraryApi.find({ createdBy: userId });

  // all files here
  const getAllFiles = await LibraryApi.find({});
  const getConsFiles = await LibraryApi.find({ category: "counselling" });
  const getMedicFiles = await LibraryApi.find({ category: "medic" });

  // Find all resources that have been accessed by the user
  const accessedResources = await LibraryApi.find({
    "accessLogs.userId": userId,
  });

  // Filter and map to only include access logs for the given user
  const userAccessLogs = accessedResources.flatMap((resource) =>
    resource.accessLogs
      .filter((log) => log.userId.toString() === userId.toString())
      .map((log) => ({
        resourceId: resource._id,
        title: resource.title,
        time: resource.createdAt,
      }))
  );

  const favoriteResources = await LibraryApi.find({
    "favorites.userId": userId,
  });

  res.status(200).json({
    files: getAllFiles,
    medic: getMedicFiles,
    cons: getConsFiles,
    recentUpdates: usersFiles,
    recentAccessed: userAccessLogs,
    favorites: favoriteResources,
  });
});

// Remove an accessed log
const removeAccessLog = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const { resourceId } = req.body;

  // Find the resource by ID
  const resource = await LibraryApi.findById(resourceId);
  if (!resource) {
    return res.status(404).json({ message: "Resource not found" });
  }

  // Filter out the specific access log
  resource.accessLogs = resource.accessLogs.filter(
    (log) => !(log.userId.toString() === userId.toString())
  );

  // Save the updated resource
  await resource.save();
});

// post comments
const postComments = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const { comments, _id } = req.body;

  const findUser = await Users.findOne({ _id: userId });
  const name = findUser.username;
  const commentProf = findUser.img;
  const createdBy = userId;

  // New comment object
  const newComment = {
    name,
    commentProf,
    createdBy,
    text: comments,
  };

  // Find the resource by ID and update it with the new comment
  const updatedResource = await LibraryApi.findByIdAndUpdate(
    _id,
    { $push: { comments: newComment }, $inc: { commentsCount: 1 } },
    { new: true }
  );
});

// perform the like and unlike on a resource
const likes = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const { _id } = req.body;

  const resource = await LibraryApi.findById(_id);

  if (!resource) {
    return;
  }

  // Check if the user has already liked this resource
  const userHasLiked = resource.likedBy.includes(userId);

  if (userHasLiked) {
    // User has liked, so we need to unlike

    resource.likedBy = resource.likedBy.filter((id) => id !== userId);
    resource.likes -= 1;

    if (resource.likes < 0) {
      resource.likes = 0;
    }
  } else {
    // User has not liked, so we need to like
    resource.likes += 1;
    resource.likedBy.push(userId);
  }

  // // Save the updated resource
  const updatedResource = await resource.save();

  res.status(200).json({ files: updatedResource });
});

// recently accessed
const accesss = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const { _id } = req.body;

  // Save access details
  const resource = await LibraryApi.findById(_id);
  if (resource) {
    // Check if the user has already accessed this resource
    if (
      !resource.accessLogs.find(
        (itm) => itm.userId.toString() === userId.toString()
      )
    ) {
      resource.accessLogs.push({ userId, accessedAt: new Date() });
      await resource.save();
    }
  } else {
    res.status(404).json({ message: "Resource not found" });
  }
});

// favourites added
const favorites = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const { _id } = req.body;

  // Save access details
  const resource = await LibraryApi.findById(_id);
  if (resource) {
    // Check if the user has already accessed this resource
    if (
      !resource.favorites.find(
        (itm) => itm.userId.toString() === userId.toString()
      )
    ) {
      resource.favorites.push({ userId, accessedAt: new Date() });
      await resource.save();
    }
  } else {
    res.status(404).json({ message: "Resource not found" });
  }
});

module.exports = {
  uploadFile,
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
};
