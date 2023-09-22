var express = require("express");
var router = express.Router();
const Message = require("../models/message");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

/* GET home page. */
router.get("/", async (req, res, next) => {
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

// Home POST: admin users deleting messages
router.post("/", async (req, res, next) => {
  try {
    const result = await Message.findByIdAndRemove(req.body.messageId);
    console.log(result);
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

// GET sign up form
router.get("/sign-up", function (req, res, next) {
  if (!req.user) {
    res.render("sign_up", { title: "Sign Up" });
  } else {
    res.redirect("/");
  }
});

const sign_up_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters"),
  body("last_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Last name must be specified")
    .isAlphanumeric()
    .withMessage("Last name has non-alphanumeric characters"),
  body("password")
    .isLength({ min: 5 })
    .withMessage("Passwords must be at least 5 characters"),
  body("confirm_password").custom((value, { req }) => {
    return value === req.body.password;
  }),
  body("username")
    .isLength({ min: 1, max: 12 })
    .withMessage("Usernames must be specified and less than 12 characters")
    .custom(async (value) => {
      let user = await User.findOne({ username: value }).exec();
      if (user) {
        throw new Error("Username is taken");
      }
    }),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      const user = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        username: req.body.username,
      };

      res.render("sign_up", {
        user: user,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid.
      try {
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
          const user = new User({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            username: req.body.username,
            password: hashedPassword,
            is_admin: false,
            is_member: false,
          });
          const result = await user.save();
          res.redirect("/log-in");
        });
      } catch (err) {
        return next(err);
      }
    }
  }),
];

// POST sign up form
router.post("/sign-up", sign_up_post);

// GET log in
router.get("/log-in", function (req, res, next) {
  if (!req.user) {
    res.render("log_in", { title: "Log In" });
  } else {
    res.redirect("/");
  }
});

// POST log in
router.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })
);

// GET log out
router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// GET message form
router.get("/new-message", function (req, res, next) {
  res.render("message_form", { title: "New Message", user: req.user });
});

// POST message form
const new_message_post = [
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

router.post("/new-message", new_message_post);

router.get("/join", function (req, res, next) {
  if (req.user) {
    if (req.user.is_member) {
      res.redirect("/");
    } else {
      res.render("member_form", { title: "Join Us", user: req.user });
    }
  } else {
    res.redirect("/");
  }
});

router.post("/join", async function (req, res, next) {
  if (req.body.password !== process.env.MEMBER_PASS) {
    const err = new Error("Incorrect password.");
    err.status = 401;
    return next(err);
  }

  try {
    const result = await User.updateOne(
      { username: req.user.username },
      { is_member: true }
    );
    console.log(
      `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
    );
    if (result.modifiedCount === 1) {
      res.redirect("/");
    } else {
      const err = new Error("There was a problem updating your membership.");
      err.status = 401;
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
});

router.get("/become-admin", function (req, res, next) {
  if (req.user) {
    if (req.user.is_admin) {
      res.redirect("/");
    } else {
      res.render("admin_form", { title: "Become an Admin", user: req.user });
    }
  } else {
    res.redirect("/");
  }
});

router.post("/become-admin", async function (req, res, next) {
  if (req.body.password !== process.env.ADMIN_PASS) {
    const err = new Error("Incorrect password.");
    err.status = 401;
    return next(err);
  }

  try {
    const result = await User.updateOne(
      { username: req.user.username },
      { is_admin: true }
    );
    console.log(
      `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
    );
    if (result.modifiedCount === 1) {
      res.redirect("/");
    } else {
      const err = new Error("There was a problem updating your membership.");
      err.status = 401;
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
