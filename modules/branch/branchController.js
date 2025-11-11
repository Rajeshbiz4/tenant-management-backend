var express = require("express");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
var router = express.Router();
var MongoClient = require("mongodb").MongoClient;
var myLogModule = require("../../utils/logger");
var url = "mongodb+srv://rajeshpandhare181:tY5SOl2JowgJaSW7@cluster0.adymsmg.mongodb.net/?retryWrites=true&w=majority";
var mypassModule = require("../../utils/utils");
var ObjectID = require("mongodb").ObjectID;
// mongodb://localhost:27017

// Create new user
router.post("/create", function (req, res) {
  myLogModule.info("BranchController API-Branch(user/create)", req.body);
  MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) throw err;
      myLogModule.info("payload -- " + JSON.stringify(req.body));
      if (!req.body.name) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      var dbo = db.db("manmandir");
      var payload = {
        name: req.body.name,
        owner: req.body.owner,
        Address: req.body.Address,
        start_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };
      myLogModule.info("payload -- " + JSON.stringify(payload));
      var myobj = payload;
      dbo.collection("branch").insertOne(myobj, function (err, result) {
        if (err) {
          myLogModule.error("error", err);
          res.status(400).send({ message: "error", data: err });
        } else {
          myLogModule.info("Sucess");
          res.status(200).send({ message: "document inserted", data: payload });
        }
        db.close();
      });
    }
  );
});

// get All list
router.get("/list", function (req, res) {
  myLogModule.info("BranchController API-BracnList(user/list)");
  var pageNo = parseInt(req.query.from);
  var size = parseInt(req.query.size);
  var query = {};
  if (pageNo < 0 || pageNo === 0) {
    response = {
      error: true,
      message: "invalid page number, should start with 1"
    };
    return res.status(400).json(response);
  }
  query.skip = size * (pageNo - 1);
  query.limit = size;
  MongoClient.connect(
    url,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    },
    function (err, db) {
      if (err) throw err;
      var dbo = db.db("manmandir");

      dbo
        .collection("branch")
        .find({})
        .count(function (err, count) {
          if (err) {
            console.log("Error while fatching count");
          } else {
            dbo
              .collection("branch")
              .find({}, query)
              .toArray(function (err, result) {
                if (err) throw err;
                if (result) {
                  myLogModule.info(
                    "BranchController - Branch list fetched sucessfully"
                  );
                  res.status(200).json({
                    data: result,
                    msg: "Branch list fetched sucessfully",
                    total: count
                  });
                } else {
                  myLogModule.error("BranchController - NO data found");
                  res.status(400).json({ data: err, msg: "NO data found" });
                }
                db.close();
              });
          }
        });
    }
  );
});

// Update one document
router.put("/update", function (req, res) {
  myLogModule.info("BranchController API-(Branch/update)");
  MongoClient.connect(
    url,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    },
    function (err, db) {
      var payload = {
        _id: ObjectID(req.body.id)
      };
      if (err) throw err;
      var dbo = db.db("manmandir");
      var myquery = payload;
      var newvalues = { $set: { firstName: "updated" } };
      dbo
        .collection("branch")
        .updateOne(myquery, newvalues, function (err, result) {
          if (err) throw err;
          myLogModule.info("User update sucessfully");
          res.send(result);
          db.close();
        });
    }
  );
});

// Remove one document
router.delete("/delete", function (req, res) {
  myLogModule.info("BranchController API-Delete(user/Delete)");
  var id = parseInt(req.query.id);
  if (!id) {
    response = { error: true, message: "invalid page user id" };
    return res.status(400).json(response);
  }

  MongoClient.connect(
    url,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    },
    function (err, db) {
      var payload = {
        _id: id
      };
      if (err) throw err;
      var dbo = db.db("manmandir");
      var myquery = payload;
      var newvalues = { $set: { name: "YO Rajesh" } };
      dbo
        .collection("branch")
        .deleteOne(myquery, newvalues, function (err, result) {
          if (err) throw err;
          myLogModule.info("BRanch deleted sucessfully");
          res.send("1 document deleted");
          db.close();
        });
    }
  );
});

module.exports = router;
