var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Database
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/db", {native_parser:true});



var routes = require('./routes/index');
var users = require('./routes/users');
var server_tools = require('./node_modules/server_tools/server_tools.js');


var app = express();
app.use(bodyParser());
//Socket.io
var http=require('http').Server(app);
var io=require('socket.io')(http);

var gsListener=require('http');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router
app.use(function(req,res,next)
{
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//by default, express does not support plaintext POSTs.  Let's change that.
app.use(function(req, res, next){
  if (req.is('text/*')) {
    req.text = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk){ req.text += chunk; console.log(chunk); });
    req.on('end', next);
  } else {
    next();
  }
});

app.use('/test', routes);

app.use('/p', routes);

app.listen(8080);


//******SOCKET********
io.on('connection', function(socket)
{
    console.log("user connected");
    /*socket.on('ground_station_update', function(msg)
    {
        updateDatabase(msg);
    });*/

    socket.on('button_pressed', function(msg)
    {
        console.log(msg);
    });

    socket.on('database_query', function(query)
    {
        console.log("Database query received:");
        console.log(query.collection + "\n" + query.msg);
        server_tools.queryDatabase(db, query, socket);
    });
});



//REMOVE THIS
setInterval(function()
{
    io.emit('date_broadcast', Date());
}, 1000);


//********************
http.listen(3333, function()
{
    console.log('listening on 3334');
});

app.use('/dbquery', routes);

/*
gsListener.createServer(function(req, res)
{
    console.log("DATA RECEIVED:");
    console.log(req);
    
}).listen(8080);*/

//*********ERROR HANDLERS*********

/// error handlers

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
//*******************************


module.exports = app;