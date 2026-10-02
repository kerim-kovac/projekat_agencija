var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const session = require('express-session');


const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const homeRouter = require('./routes/home');
const homeagencijaRouter = require('./routes/home-agencija');
const zaboravljenalozinkaRouter = require('./routes/zaboravljena-lozinka');
const shareRouter = require('./routes/share');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_KOD,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true
  }
}));

app.use('/', loginRouter);
app.use('/register', registerRouter);
app.use('/home', homeRouter);
app.use('/home-agencija',homeagencijaRouter);
app.use('/zaboravljena-lozinka', zaboravljenalozinkaRouter);
app.use('/share', shareRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('Main/error');
});

module.exports = app;
