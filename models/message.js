const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  username: { type: String, required: true },
  timestamp: { type: String, required: true },
});

module.exports = mongoose.model("Message", MessageSchema);
