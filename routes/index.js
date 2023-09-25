var express = require("express");
var router = express.Router();

// GET home page for membersonly.
router.get("/", function (req, res) {
  res.redirect("/membersonly");
});

module.exports = router;
