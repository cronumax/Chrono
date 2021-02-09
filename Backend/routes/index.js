const express = require('express');
const csrf = require('csurf');
const csrfProtection = csrf();
const passport = require('passport');
const router = express.Router();


router.get('/user/profile', isLoggedIn, function (req, res, next) {
        res.send({ hello: 'world' });
});

router.get('/user/logout', isLoggedIn, function (req, res, next) {
    req.logout();
    res.send({ hello: 'world' });
});

router.get('/', function(req, res, next) {
  console.log("test test")
  res.send("hello world **********");

});


router.use(csrfProtection);
router.use('/', notLoggedIn, function (req, res, next) {
    next();
});

router.get('/user/signup', (req, res, next) =>{
  let messages = req.flash('error');
  res.send({ csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0})
});



router.post('/user/signup', passport.authenticate('local.signup', {
    failureRedirect: '/user/signup',
    failureFlash: true
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.send({ hello: 'fail' });
    } else {
        res.send({ hello: 'world' });
    }
});


router.get('/user/signin', (req, res, next) =>{
  let messages = req.flash('error');
  res.render('user/signin', { csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0})
});


router.post('/user/signin', passport.authenticate('local.signin', {
    failureRedirect: '/user/signin',
    failureFlash: true
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.send({ hello: 'fail' });
    } else {
        res.send({ hello: 'world' });
    }
});


module.exports = router;
function isSignIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.send({ hello: 'fail' });
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.send({ hello: 'world' });
}

function notLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.send({ hello: 'world' });
}
