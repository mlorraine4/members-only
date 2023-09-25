const Message = require("../models/message");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// GET request for homepage.
exports.index_GET = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({}).exec();

  if (messages === null) {
    // No results.
    const err = new Error("Messages not found");
    err.status = 404;
    return next(err);
  }

  res.render("index", {
    title: "Members Only Chat",
    messages: messages,
    user: req.user,
  });
});

// POST request for admin removal of messages on homepage.
exports.index_POST = asyncHandler(async (req, res, next) => {
  try {
    const result = await Message.findByIdAndRemove(req.body.messageId);
    console.log(result);
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

// GET request for new message form.
exports.new_message_GET = asyncHandler(async (req, res, next) => {
  res.render("message_form", { title: "New Message", user: req.user });
});

// POST request for new message form submission.
exports.new_message_POST = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 20 })
    .escape()
    .withMessage("Title is required and must be under 20 characters"),
  body("message")
    .trim()
    .isLength({ min: 1, max: 250 })
    .escape()
    .withMessage("Message body is required and must beunder 250 characters"),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render("sign_up", {
        errors: errors.array(),
      });
    } else {
      try {
        const message = new Message({
          text: req.body.message,
          title: req.body.title,
          username: req.user.username,
          timestamp: Date.now(),
        });
        await message.save();
        res.redirect("/");
      } catch (err) {
        next(err);
      }
    }
  }),
];
