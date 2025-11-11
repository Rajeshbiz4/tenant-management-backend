// grab the things we need
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// create a schema
var orderSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true },
  Address: { type: String },
  start_date: Date,
  created_at: Date,
  updated_at: Date
});

// the schema is useless so far
// we need to create a model using it
var order = mongoose.model("order", orderSchema);

// make this available to our users in our Node applications
module.exports = order  ;
