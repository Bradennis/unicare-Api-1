require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const notFound = require("./MiddleWare/notFound");
const authRoute = require("./routes/studentSideAuth");
const tasks = require("./routes/tasks");
const chatRoute = require("./routes/chats");
const appointmentRoute = require("./routes/appointments");
const authMiddleWare = require("./MiddleWare/StudentAuthMiddleWare");
const { uploadFile, postResource } = require("./Controllers/tasks");
const errorHandlerMiddleWare = require("./MiddleWare/errorHandler");
const connectDb = require("./Database/connectDb");
const cookies = require("cookie-parser");
const Users = require("./Models/Users.js");

// the professionals side routers
const authRouter = require("./routes/auth.js");
const doctorRouter = require("./routes/doctor.js");
const counsellorRouter = require("./routes/counsellor.js");

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  // pingTimeout: 60000,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("setup", async (userData) => {
    socket.join(userData);
    socket.userId = userData; //

    // Update the user's status to online in the database and reset `hasLoggedOut`
    await Users.findByIdAndUpdate(userData, {
      online: true,
      hasLoggedOut: false,
    });
    socket.emit("connection");
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      try {
        // Check if the user has already logged out
        const user = await Users.findById(socket.userId);

        if (user && !user.hasLoggedOut) {
          // If the user hasn't logged out, update the lastSeen and online status
          await Users.findByIdAndUpdate(
            socket.userId,
            {
              online: false,
              lastSeen: new Date(),
              hasLoggedOut: true,
            },
            { new: true }
          );
          console.log("Updated user on disconnect:", user);
        } else {
          console.log(
            "User had already logged out, no need to update last seen"
          );
        }
      } catch (err) {
        console.error("Error updating last seen status:", err);
      }
    } else {
      console.warn("socket.userId is not set on disconnect");
    }

    console.log("User disconnected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`a user joined the chatroom ${room}`);
  });

  socket.on("new message", (newMsgReceived) => {
    const participants = newMsgReceived.data.participants;
    const lastMessage =
      newMsgReceived.data.messages[newMsgReceived.data.messages.length - 1];
    console.log(lastMessage);

    if (!participants) return;

    participants.forEach((user) => {
      if (user === lastMessage.sender._id) return;
      socket.to(newMsgReceived.chat_id).emit("message received", {
        data: newMsgReceived.data,
        id: newMsgReceived.chat_id,
      });
    });
  });
});

// setting up the multer storage here

// multer for receiving the profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/profImages");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// multer for receiving the video files
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/videoFiles");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + path.extname(file.originalname));
  },
});

const uploadVideoFiles = multer({ storage: videoStorage });

// multer for receiving the video files
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/audioFiles");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + path.extname(file.originalname));
  },
});

const uploadAudioFiles = multer({ storage: audioStorage });

// multer for receiving the document files
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/docFiles");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + path.extname(file.originalname));
  },
});

const uploadDocFiles = multer({ storage: docStorage });

// receiving image files here
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/imageFiles");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + path.extname(file.originalname));
  },
});

const uploadImageFiles = multer({ storage: imageStorage });

// setting up the multer storage ends here

app.use(cookies());
app.use(express.json());
app.use(express.static("images"));

app.use("/api/auth", authRouter);
app.use("/panel", doctorRouter);
app.use("/panel", counsellorRouter);

app.use("/knust.students/wellnesshub/auth", authRoute);
app.use("/knust.students/wellnesshub/tasks", authMiddleWare, tasks);
app.use("/knust.students/wellnesshub/chats", authMiddleWare, chatRoute);
app.use(
  "/knust.students/wellnesshub/appointments",
  authMiddleWare,
  appointmentRoute
);

// the file api requests here
app.patch("/upload", authMiddleWare, upload.single("profImage"), uploadFile);

app.post(
  "/library/resources/video",
  authMiddleWare,
  uploadVideoFiles.single("video"),
  (req, res) => {
    res.status(200).json({
      msg: "video was updated successfully",
      vid: req.file.filename,
    });
  }
);

app.post(
  "/library/resources/doc",
  authMiddleWare,
  uploadDocFiles.single("doc"),
  (req, res) => {
    res.status(200).json({
      msg: "doc was updated successfully",
      doc: req.file.filename,
    });
  }
);

app.post(
  "/library/resources/image",
  authMiddleWare,
  uploadImageFiles.single("image"),
  (req, res) => {
    res.status(200).json({
      msg: "image was updated successfully",
      img: req.file.filename,
    });
  }
);

app.post(
  "/library/resources/audio",
  authMiddleWare,
  uploadAudioFiles.single("audio"),
  (req, res) => {
    res.status(200).json({
      msg: "audio was updated successfully",
      audio: req.file.filename,
    });
  }
);

// file api requests ends here

app.get("/", (req, res) => {
  res.send(" Your server is running here");
});

//middlewares
app.use(notFound);
app.use(errorHandlerMiddleWare);

PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDb(process.env.MONGODB_URI);
    server.listen(PORT, () => console.log(`app listening at port ${PORT}...`));
  } catch (error) {
    console.log(error);
  }
};

start();
