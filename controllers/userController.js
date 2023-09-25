const bcrypt = require("bcryptjs");
const User = require("../models/user");
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// GET request for sign up form.
exports.sign_up_GET = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.render("sign_up", { title: "Sign Up" });
  } else {
    res.redirect("/");
  }
});

// POST request for user signing up submission.
exports.sign_up_POST = [
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
          res.redirect("/membersonly/log-in");
        });
      } catch (err) {
        return next(err);
      }
    }
  }),
];

// GET request for log in form.
exports.log_in_GET = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.render("log_in", { title: "Log In" });
  } else {
    res.redirect("/");
  }
});

// POST request for log in form submission.
exports.log_in_POST = passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/membersonly/log-in",
});

// GET request for user log out (no page, log out is handled by express which calls a redirect)
exports.log_out_GET = asyncHandler(async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// GET request for becoming a member form.
exports.become_member_GET = asyncHandler(async (req, res, next) => {
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

// POST request for becoming a member form submission.
exports.become_member_POST = asyncHandler(async (req, res, next) => {
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

// GET request for becoming an admin form.
exports.become_admin_GET = asyncHandler(async (req, res, next) => {
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

// POST request for becoming an admin form submission.
exports.become_admin_POST = asyncHandler(async (req, res, next) => {
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
