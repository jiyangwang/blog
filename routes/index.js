var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js');

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
  Post.get(null, function (err, posts) {
    if (err) {
      posts = [];
    } 
    res.render('index', {
      title: 'Home',
      user: req.session.user,
      posts: posts,
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
        post = new Post(currentUser.name, req.body.title, req.body.post);
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
