var express = require("express");
var bodyParser = require("body-parser");
var port = 8080;
var app = express();

// const dotenv = require("dotenv");
// dotenv.config();
// var authenticateToken = require("./middleware/authenticateToken.js");
// var user_controller = require("./modules/user/userController.js");
// var auth_Controller = require("./modules/auth/authController.js");
// var branch_Controller = require("./modules/branch/branchController.js");
// var image_controller = require("./modules/images/imageController.js");

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

app.use("/login", auth_Controller);
app.use("/user", user_controller);
app.use("/branch", branch_Controller);
app.use("/images", image_controller);

app.listen(port, () => {
  console.log("Server listening on port " + port);
});
