const notFound = (req, res, next) => res.status(404).send("request not found");

module.exports = notFound;
