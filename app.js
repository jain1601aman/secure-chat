
const path = require('path');
const express = require('express')
const app = express()
var hash = require('pbkdf2-password')()
var session = require('express-session');
// const functions = require("firebase-functions");
var http = app.listen(process.env.PORT)
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
  },
})

app.use('/static',express.static('./static/'));
app.set('views','./views')
app.set('view engine','ejs')
app.use(express.urlencoded({extended:true}));
app.use(session({
  resave: false, 
  saveUninitialized: false,
  secret: 'shhhh, very secret'
}));
app.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});


// dummy database

var userss = {
  tj: { name: 'tj' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash({ password: 'foobar' }, function (err, pass, salt, hash) {
  if (err) throw err;
  // store the salt & hash in the "db"
  userss.tj.salt = salt;
  userss.tj.hash = hash;
});


function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

function authenticate(name, pass, fn) {
  // if (!module.main) console.log('authenticating %s:%s', name, pass);
  var user = userss[name];
  if (!user) {
    console.log('yaha aayaa')
    return fn(new Error('cannot find user'));}
  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user)
    fn(new Error('invalid password'));
  });
}
var userdata = []
var usersss = {}
io.on('connection', socket =>{
    // console.log('new user')
    socket.on('new-user' , user =>{
      userdata.push({
        id : socket.id,
        Name : user.name,
        pubkey : user.pubkey
      })
      usersss[socket.id] = user.name
      })
      socket.on('get-key' , user =>{
        var i = 0;
        var x = userdata[i]
        if(x.Name==user)
        {
          i=1
        }
        x = userdata[i]
        socket.emit('take-key',x.pubkey)
        
      })
socket.on('send-chat-message' , data =>{
    console.log('encrypted data recived : ')
    console.log(data)
    socket.broadcast.emit('send' , {user:usersss[socket.id],data:data})
})
socket.on('disconnect',()=>{
  delete usersss[socket.id]
})

})

app.get('/' , function(req,res){
    res.render('index');
})
app.post('/' , function(req,res){
  console.log(req.body.room)
  console.log(req.body.pswd)
  res.redirect('/')
})
app.get('*/login', restrict, function(req, res){
  res.render('room');
});

app.post('*/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      req.session.regenerate(function(){
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.name
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.redirect('login');
      });
    } else {
      console.log('yaha aayaa')
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.'
        + ' (use "tj" and "foobar")';
      res.render('index');
    }
  });
});
app.get('*/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});
http
