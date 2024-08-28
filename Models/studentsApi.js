const mongoose = require("mongoose");

const studentsListSchema = new mongoose.Schema({
  surname: {
    type: String,
    maxLength: 20,
  },
  other_names: {
    type: String,
    maxLength: 20,
  },
  date_of_birth: {
    type: String,
  },
  id: {
    type: String,
    maxLength: 8,
  },
  index_number: {
    type: String,
    maxLength: 7,
  },
  school_vodafone_number: {
    type: String,
    maxLength: 10,
  },
  country: {
    type: String,
  },
  postal_address: {
    type: String,
  },
  residential_address: {
    type: String,
  },
  region: {
    type: String,
  },
  contact: {
    type: String,
    maxLength: 10,
  },
  email: {
    type: String,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ],
    unique: true,
  },
  school_email: {
    type: String,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ],
    unique: true,
  },
  program: {
    type: String,
    maxLength: 40,
  },
  sex: {
    type: String,
  },
  year: {
    type: Number,
  },
});

module.exports = mongoose.model("StudentsList", studentsListSchema);
