var mongodb = require('./db');
markdown = require('markdown').markdown;

function Post(name, head, title, tags, post) {
  this.name = name;
  this.head = head;
  this.title = title;
  this.tags = tags;
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
      head: this.head,
      time: time,
      title:this.title,
      tags: this.tags,
      post: this.post,
      comments: [],
      reprint_info: {},
      pv: 0
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


//get one article
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
        if (err) {
          mongodb.close();
          return callback(err);
        }
        if (doc) {
          //pv + 1
          collection.update({
            "name": name,
            "time.day": day,
            "title": title
          }, {
            $inc: {"pv": 1}
          }, function (err) {
            mongodb.close();
            if (err) {
              return callback(err);
            }
          });
          //parse markdown into html
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
          });
          callback(null, doc);//return one article
        }
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
      //search for delete
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        //add reprint_from
        var reprint_from = "";
        if (doc.reprint_info.reprint_from) {
          reprint_from = doc.reprint_info.reprint_from;
        }
        if (reprint_from != "") {
          //update reprint_to
          collection.update({
            "name": reprint_from.name,
            "time.day": reprint_from.day,
            "title": reprint_from.title
          }, {
            $pull: {
              "reprint_info.reprint_to": {
                "name": name,
                "day": day,
                "title": title
            }}
          }, function (err) {
            if (err) {
              mongodb.close();
              return callback(err);
            }
          });
        }

        //delete repost
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

// return all tags
Post.getTags = function(callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //distinct
      collection.distinct("tags", function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

// return all article with tag
Post.getTag = function(tag, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //query
      collection.find({
        "tags": tag
      }, {
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

//search by keyword
Post.search = function(keyword, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp(keyword, "i");
      collection.find({
        "title": pattern
      }, {
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

//repost an article
Post.reprint = function(reprint_from, reprint_to, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //find original post
      collection.findOne({
        "name": reprint_from.name,
        "time.day": reprint_from.day,
        "title": reprint_from.title
      }, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }

        var date = new Date();
        var time = {
            date: date,
            year : date.getFullYear(),
            month : date.getFullYear() + "-" + (date.getMonth() + 1),
            day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }

        delete doc._id;

        doc.name = reprint_to.name;
        doc.head = reprint_to.head;
        doc.time = time;
        doc.title = (doc.title.search(/[repost]/) > -1) ? doc.title : "[repost]" + doc.title;
        doc.comments = [];
        doc.reprint_info = {"reprint_from": reprint_from};
        doc.pv = 0;

        //update reprint_to
        collection.update({
          "name": reprint_from.name,
          "time.day": reprint_from.day,
          "title": reprint_from.title
        }, {
          $push: {
            "reprint_info.reprint_to": {
              "name": doc.name,
              "day": time.day,
              "title": doc.title
          }}
        }, function (err) {
          if (err) {
            mongodb.close();
            return callback(err);
          }
        });

        collection.insert(doc, {
          safe: true
        }, function (err, post) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(err, post[0]);
        });
      });
    });
  });
};
