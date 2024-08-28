const { StatusCodes } = require("http-status-codes");
const CustomApiError = require("./CustomApiError");

class Unauthenticated extends CustomApiError {
  constructor(msg) {
    super(msg);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = Unauthenticated;
