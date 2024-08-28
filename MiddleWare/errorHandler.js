const CustomApiError = require("../CustomErrors/CustomApiError");
const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleWare = (err, req, res, next) => {
  if (err instanceof CustomApiError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }
  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .send("something went wrong, try again later");
  next();
};

module.exports = errorHandlerMiddleWare;
