// grab the things we need
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  mobile: { type: String, required: true },
  userType: { type: String, required: true }, // admin, Regular user
  created_at: Date,
  updated_at: Date
});

// the schema is useless so far
// we need to create a model using it
var users = mongoose.model("users", userSchema);

// make this available to our users in our Node applications
module.exports = users;
