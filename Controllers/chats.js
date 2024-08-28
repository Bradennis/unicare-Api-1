const { BadRequest } = require("../CustomErrors");
const asyncWrapper = require("../MiddleWare/async");
const ChatModel = require("../Models/ChatModel");
const studentsApi = require("../Models/studentsApi");
const Users = require("../Models/Users");

// find user function
const findUserModel = async (userId) => {
  let user = await Users.findById(userId);

  // if no user matches the userId
  if (!user) {
    return null;
  }

  if (user.role === "student") {
    const findDetails = await studentsApi.findOne({ id: user.student_id });
    return { user, findDetails };
  } else {
    return { user };
  }

  i;
};

const accessSingleChat = asyncWrapper(async (req, res) => {
  const { userId } = req.body;
  const id = req.user.id;

  const participant = await findUserModel(userId);

  let details;

  // i will work on the fullname side later when i get to campus
  if (participant.user.role === "student") {
    details = {
      username: participant.user.username,
      img: participant.user.img,
      online: participant.user.online,
      lastSeen: participant.user.lastSeen,
      fullname: `${participant.findDetails.surname} ${participant.findDetails.other_names}`,

      year: participant.findDetails.year,
      student_id: participant.findDetails.id,
      contact: participant.findDetails.contact,
      telecel: participant.findDetails.school_vodafone_number,
      email: participant.findDetails.email,
      hall: participant.findDetails.hall,
      programme: participant.findDetails.program,
    };
  } else {
    details = {
      username: participant.user.username,
      img: participant.user.img,
      online: participant.user.online,
      lastSeen: participant.user.lastSeen,
      fullname: `${participant.user.first_name} ${participant.user.last_name}`,
      contact: participant.user.number,
    };
  }

  if (!userId) {
    throw new BadRequest(`no userId is provided`);
  }

  // Find the chat between the two users and populate sender details
  let chat = await ChatModel.findOne({
    participants: { $all: [id, userId] },
  }).populate("messages.sender", "username img");
  if (!chat) {
    chat = new ChatModel({ participants: [id, userId], messages: [] });
    await chat.save();

    chat = await ChatModel.findById(chat._id).populate(
      "messages.sender",
      "username img"
    );
  }

  res.json({ chat, details });
});

const sendMessage = asyncWrapper(async (req, res) => {
  const { message, chatId } = req.body;
  const id = req.user.id;

  let chat = await ChatModel.findOne({ _id: chatId });
  chat.messages.push({ sender: id, text: message });
  await chat.save();

  chat = await ChatModel.findById(chat._id).populate(
    "messages.sender",
    "username img"
  );

  res.status(200).send(chat);
});

module.exports = { accessSingleChat, sendMessage };
