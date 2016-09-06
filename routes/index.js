var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './public/images')
    },
    filename: function (req, file, cb){
        cb(null, file.originalname)
    }
});
var upload = multer({
    storage: storage
});

module.exports = function(app) {
  app.get('/', function (req, res) {
    // check if it is the first page
    var page = parseInt(req.query.p) || 1;
    // query get 10 pages back
    Post.getTen(null, page, function (err, posts, total) {
      if (err) {
        posts = [];
      } 
      res.render('index', {
        title: 'Home',
        posts: posts,
        page: page,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
      title: 'Register',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //check whether the passwords are the same or not
    if (password_re != password) {
      req.flash('error', 'Please enter the same password!'); 
      return res.redirect('/reg');//return registration page
    }
    //generate md5 for password
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: name,
        password: password,
        email: req.body.email
    });
    //check username validation
    User.get(newUser.name, function (err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if (user) {
        req.flash('error', 'Username has been used!');
        return res.redirect('/reg');//return registration
      }
      //add new user if not exists
      newUser.save(function (err, user) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg');//reg err, return reg page
        }
        req.session.user = newUser;//user data into session
        req.flash('success', 'You have successfully registered!');
        res.redirect('/');//reg success, back to main page
      });
    });
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login', {
        title: 'Login',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
    //generate md5 for password
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //check user validation
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', 'Wrong username!'); 
        return res.redirect('/login');//return to login page if user invalid
      }
      //check password
      if (user.password != password) {
        req.flash('error', 'Wrong Password!'); 
        return res.redirect('/login');//return to login page if wrong password
      }
      //all match
      req.session.user = user;
      req.flash('success', 'You have successfully login!');
      res.redirect('/');//return to main page
    });
  });

  app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
    res.render('post', {
      title: 'Post',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
    var currentUser = req.session.user,
      tags = [req.body.tag1, req.body.tag2, req.body.tag3],
      post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
    post.save(function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      req.flash('success', 'Post success!');
      res.redirect('/');
    });
  });

  app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', 'You have successfully logout!');
    res.redirect('/');//return to main page
  });

  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {
    res.render('upload', {
      title: 'Upload',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', checkLogin);
  app.post('/upload', upload.array('field1', 5), function (req, res) {
    req.flash('success', 'Upload successfully!');
    res.redirect('/upload');
  });

  app.get('/archive', function (req, res) {
    Post.getArchive(function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('archive', {
        title: 'Archive',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags', function (req, res) {
    Post.getTags(function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('tags', {
        title: 'Tags',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
      if (err) {
        req.flash('error',err); 
        return res.redirect('/');
      }
      res.render('tag', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/links', function (req, res) {
    res.render('links', {
      title: 'Links',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.get('/search', function (req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('search', {
        title: "SEARCH:" + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/u/:name', function (req, res) {
    var page = parseInt(req.query.p) || 1;
    // check username validation
    User.get(req.params.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!'); 
        return res.redirect('/');
      }
      //return 10 page
      Post.getTen(user.name, page, function (err, posts, total) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        } 
        res.render('user', {
          title: user.name,
          posts: posts,
          page: page,
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    }); 
  });

  app.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
               date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 
    var comment = {
        name: req.body.name,
        head: head,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', 'Comment added successfully!');
      res.redirect('back');
    });
  });

  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      res.render('edit', {
        title: 'Edit',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
      var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
      if (err) {
        req.flash('error', err); 
        return res.redirect(url);
      }
      req.flash('success', 'Edit successfully!');
      res.redirect(url);
    });
  });

  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', 'Deleted successfully!');
      res.redirect('/');
    });
  });

  app.get('/reprint/:name/:day/:title', checkLogin);
  app.get('/reprint/:name/:day/:title', function (req, res) {
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect(back);
      }
      var currentUser = req.session.user,
          reprint_from = {name: post.name, day: post.time.day, title: post.title},
          reprint_to = {name: currentUser.name, head: currentUser.head};
      Post.reprint(reprint_from, reprint_to, function (err, post) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('back');
        }
        req.flash('success', 'Repost successfully!');
        res.redirect('/');
      });
    });
  });

  function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', 'You need to login first!'); 
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', 'You have already login!'); 
      res.redirect('back');
    }
    next();
  }
};
