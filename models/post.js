var mongodb = require('./db');
markdown = require('markdown').markdown;

function Post(name, title, post) {
  this.name = name;
  this.title = title;
  this.post = post;
}

module.exports = Post;

//save relative info
Post.prototype.save = function(callback) {
  var date = new Date();
  //date format
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
  }
  //file to database
  var post = {
      name: this.name,
      time: time,
      title:this.title,
      post: this.post,
      comments: []
  };
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //load posts
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //insert posts
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);//return err
        }
        callback(null);//return null
      });
    });
  });
};

//load 10 article
Post.getTen = function(name, page, callback) {
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //load posts
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //return count
      collection.count(query, function (err, total) {
        //query
        collection.find(query, {
          skip: (page - 1)*10,
          limit: 10
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          //parse markdown into html
          docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
          });  
          callback(null, docs, total);
        });
      });
    });
  });
};


//get an article
Post.getOne = function(name, day, title, callback) {
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //load posts
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //query
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        //parse markdown into html
        if (doc) {
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
          });
        }
        callback(null, doc);//return result
      });
    });
  });
};

//return markdown format
Post.edit = function(name, day, title, callback) {
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //load posts
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //query
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, doc);//return markdown result
      });
    });
  });
};

//edit article
Post.update = function(name, day, title, post, callback) {
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //load posts
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //update article content
      collection.update({
        "name": name,
        "time.day": day,
        "title": title
      }, {
        $set: {post: post}
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

//delete article
Post.remove = function(name, day, title, callback) {
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //load posts
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //query
      collection.remove({
        "name": name,
        "time.day": day,
        "title": title
      }, {
        w: 1
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

//return all archive
Post.getArchive = function(callback) {
  //open database
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //load posts
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //return name, time, title
      collection.find({}, {
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};