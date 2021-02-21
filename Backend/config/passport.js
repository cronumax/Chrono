var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');
const nodemailer = require("nodemailer");
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {
    try{
      req.checkBody('email', 'Invalid email').notEmpty().isEmail();
      req.checkBody('password', 'Invalid password').notEmpty().isLength({min:4});
      var errors = req.validationErrors();
      if (errors) {
          var messages = [];
          errors.forEach(function(error) {
             messages.push(error.msg);
          });
          return done(null, false, req.flash('error', messages));
      }
    }catch(err) {
        return done(null, false, req.flash('error', "Validate Fail"));
    }
    User.findOne({'email': email}, function (err, user) {
        if (err) {
            return done(err);
        }
        if (user) {
            return done(null, false, {message: 'Email is already in use.'});
        }
        var newUser = new User();
        newUser.email = email;
        newUser.password = newUser.encryptPassword(password);
        newUser.save(function(err, result) {
           if (err) {
               return done(err);
           }
           return done(null, newUser);
        });
    });
}));

passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done) {
    try{
      req.checkBody('email', 'Invalid email').notEmpty().isEmail();
      req.checkBody('password', 'Invalid password').notEmpty();
      var errors = req.validationErrors();
      if (errors) {
          var messages = [];
          errors.forEach(function(error) {
              messages.push(error.msg);
          });
          return done(null, false, req.flash('error', messages));
      }
    }catch(err) {
        return done(null, false, req.flash('error', "Validate Fail"));
    }
    User.findOne({'email': email}, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, {message: 'No user found.'});
        }
        if (!user.validPassword(password)) {
            return done(null, false, {message: 'Wrong password.'});
        }
        return done(null, user);
    });
}));



passport.use('local.recover', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
}, function(req, email, password, done) {
    try{
      req.checkBody('email', 'Invalid email').notEmpty().isEmail();

    }catch(err) {
        return done(null, false, req.flash('error', "Validate Fail"));
    }

    const token = crypto.randomBytes(20).toString('hex');
    const date = Date.now() + 3600000;
    const link = "http://" + req.headers.host + "/user/reset/" + token;

    User.findOneAndUpdate({'email': email}, {resetPasswordToken:token , resetPasswordExpires: date}, {upsert: true}, function(err, user) {
      if (err) {
          return done(err);
      }
      if (!user) {
          return done(null, false, {message: 'No Email found.'});
      }

      let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'kaipingwang809@gmail.com',
              pass: '+A78c10d7e'
          }
      });

      const mailOptions = {
            from: 'Kevin <kaipingwang809@gmail.com>',
            to: user.email,
            subject: 'Changed Your Password',
            text:  `Hi User \n
                    Please click on the following link ${link} to reset your password. \n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`
        }

          transporter.sendMail(mailOptions, function (err, res) {
            if(err){
                console.log('Error');
            } else {
                console.log('Email Sent');
            }
          })
          return done(null, user);
      });

}));




passport.use('local.resetPassword', new LocalStrategy({
  usernameField: 'password',
  passwordField: 'confirmPassword',
  passReqToCallback: true
}, function(req, password, confirmPassword,  done) {

  try{
    req.checkBody('password').notEmpty().isEmail();
    req.checkBody('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.password));

  }catch(err) {
      return done(null, false, req.flash('error', err));
  }
  User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {
        if (!user) {
          console.log(req.params.token)
          console.log(Date.now())
          return done(null, false, req.flash('error', err));
        }

        //Set the new password
        user.password = user.encryptPassword(password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Save
        user.save(function (err, user){
            if (err) {
                return done(err);
            }

            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'kaipingwang809@gmail.com',
                    pass: '+A78c10d7e'
                }
            });

            const mailOptions = {
                  from: 'Kevin <kaipingwang809@gmail.com>',
                  to: user.email,
                  subject: "Your password has been changed",
                  text:  `Hi User \n
                          This is a confirmation that the password for your account ${user.email} has just been changed.\n`
              }

                transporter.sendMail(mailOptions, function (err, res) {
                  if(err){
                      console.log('Error');
                  } else {
                      console.log('Confirm Email Sent');
                  }
                })

            return done(null, user);
        });
    });

}));
