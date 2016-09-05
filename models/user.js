var crypto = require('crypto');
var mongodb = require('./db');

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
};

module.exports = User;

//save user data
User.prototype.save = function(callback) {
  //user file into database
  var md5 = crypto.createHash('md5'),
      email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
      head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
  var user = {
      name: this.name,
      password: this.password,
      email: this.email,
      head: head
  };
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);//return err
    }
    //load users
    db.collection('users', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//return err
      }
      collection.insert(user, {
        safe: true
      }, function (err, user) {
        mongodb.close();
        if (err) {
          return callback(err);//return err
        }
        callback(null, user[0]);//return success
      });
    });
  });
};

//load user data
User.get = function(name, callback) {
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);//return err
    }
    //load users
    db.collection('users', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//return err
      }
      //search name
      collection.findOne({
        name: name
      }, function (err, user) {
        mongodb.close();
        if (err) {
          return callback(err);//return err
        }
        callback(null, user);//return success
      });
    });
  });
};