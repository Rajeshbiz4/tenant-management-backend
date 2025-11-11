// grab the things we need
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// create a schema
var categorySchema = new Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  created_at: Date,
  updated_at: Date
});

// the schema is useless so far
// we need to create a model using it
var category = mongoose.model("category", categorySchema);

// make this available to our users in our Node applications
module.exports = category;
