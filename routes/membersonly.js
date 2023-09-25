const express = require("express");
const router = express.Router();

// Require controller modules.
const message_controller = require("../controllers/messageController");
const user_controller = require("../controllers/userController");

// ROUTES
/// user
//// get homepage, post homepage for admin deleting messages
router.get("/", message_controller.index_GET);
router.post("/", message_controller.index_POST);

// get & post for sign up
router.get("/sign-up", user_controller.sign_up_GET);
router.post("/sign-up", user_controller.sign_up_POST);

// get & post for log in/out (no log out post: get redirects user based on successful/failed log in attempt)
router.get("/log-in", user_controller.log_in_GET);
router.post("/log-in", user_controller.log_in_POST);
router.get("/log-out", user_controller.log_out_GET);

// get & post for becoming a member
router.get("/become-member", user_controller.become_member_GET);
router.post("/become-member", user_controller.become_member_POST);

// get & post for becoming an admin
router.get("/become-admin", user_controller.become_admin_GET);
router.post("/become-admin", user_controller.become_admin_POST);

/// messages
// get & post for adding messages
router.get("/new-message", message_controller.new_message_GET);
router.post("/new-message", message_controller.new_message_POST);

module.exports = router;
