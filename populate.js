require("dotenv").config();
const studentsJsonList = require("./students.json");
const studentsLitSchema = require("./Models/studentsApi");
const connectDb = require("./Database/connectDb");

const start = async () => {
  try {
    await connectDb(process.env.MONGODB_URI);
    await studentsLitSchema.deleteMany();
    await studentsLitSchema.create(studentsJsonList);
    console.log("this procedure was succesful");
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
