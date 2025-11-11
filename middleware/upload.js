const multer = require("multer");
// var MongoClient = require('mongoose');
// var url = 'mongodb://127.0.0.1:27017/mydb';
// var url = `${process.env.MONGODB}/mydb`;
// const promise = MongoClient.connect(url, { useNewUrlParser: true });

// upload image to folder
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
      let result = "";
      const alphaNumericCharacters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const alphabetsLength = alphaNumericCharacters.length;
      for (let i = 0; i < 8; i++) {
        result += alphaNumericCharacters.charAt(Math.floor(Math.random() * alphabetsLength));
      }
      const randomNumber = Math.floor(Math.random() * 1000000);
    
    cb(null, randomNumber + "_" + result + "-" + file.originalname )
  }
})

module.exports = multer({ storage: storage })
// var upload = 