const User = require("../Models/Users.js");

const getAllCounsellors = async (req, res) => {
  try {
    const counellors = await User.find({ role: "counsellor" });
    res.json(counellors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCounsellor = async (req, res) => {
  const id = req.params.id;
  try {
    const deleteCounsellor = await User.findByIdAndDelete(id);
    if (!deleteCounsellor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(deleteCounsellor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { deleteCounsellor, getAllCounsellors };
