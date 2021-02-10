var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose =require('mongoose');
var routes = require('./routes/index');
var session = require('express-session');
var passport = require('passport');
var validator = require('express-validator');
var jade = require('jade');
var flash = require('connect-flash');
mongoose.connect('mongodb://127.0.0.1:27017/test', { useUnifiedTopology: true ,useNewUrlParser: true} );
var MongoStore = require('connect-mongo')(session);
require('./config/passport');
var app = express();
const csrf = require('csurf');

// uncomment after placing your favicon in /public
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false,
   store: new MongoStore({ mongooseConnection: mongoose.connection }),// use the existing mongoconnection
  cookie: { maxAge: 180 * 60 * 1000 }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next)=> {
    res.locals.login = req.isAuthenticated();// set a global variable thus veiw can know whether it is login or not
    res.locals.session = req.session;// make sure get everywhere in the server, specially views, without any problem to pass into router
    next();
});
app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res, next) =>{
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
