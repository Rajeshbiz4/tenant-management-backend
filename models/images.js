// grab the things we need
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// create a schema
var myImageSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  desc: { type: String, required: true },
  weight: { type: String, required: true },
  image: { type: String, required: true },
  created_at: Date,
  updated_at: Date
});

// the schema is useless so far
// we need to create a model using it
var myImage = mongoose.model("images", myImageSchema);

// make this available to our users in our Node applications
module.exports = myImage;
