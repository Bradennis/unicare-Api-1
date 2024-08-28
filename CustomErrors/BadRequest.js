const { StatusCodes } = require("http-status-codes");
const CustomApiError = require("./CustomApiError");

class BadRequest extends CustomApiError {
  constructor(msg) {
    super(msg);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = BadRequest;
