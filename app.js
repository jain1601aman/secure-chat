// var crypto = require('')
global.navigator = { appName: 'nodejs' }; // fake the navigator object
global.window = {}; // fake the window object
const JSEncrypt = require('JSEncrypt/bin/jsencrypt');
const path = require('path');
const express = require('express')
const app = express()
var hash = require('pbkdf2-password')()
var session = require('express-session');
var mongoose = require('mongoose')
var port = process.env.PORT || 5000
var http = app.listen(port, '0.0.0.0')
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
    },
})

// db connection
var url = "mongodb+srv://admin:admin@4321@secure-chat.xjmni.mongodb.net/secure-chat"
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => { console.log('db connected') }).catch((e) => { console.log(e.message) });
var db = mongoose.connection
    // db models
var rooms = require('./rooms');

//check empty object
function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

app.use('/static', express.static('./static/'));
app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'shhhh, very secret'
}));
app.use(function(req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
});

function debug() { console.log('yaha aayaa') }

var removeByAttr = function(arr, attr, value) {
    var i = arr.length;
    while (i--) {
        if (arr[i] &&
            arr[i].hasOwnProperty(attr) &&
            (arguments.length > 2 && arr[i][attr] === value)) {

            arr.splice(i, 1);

        }
    }
    return arr;
}

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.render('restrict');
    }
}

function authenticate(name, pass, fn) {
    // if (!module.main) console.log('authenticating %s:%s', name, pass);
    rooms.find({ roomid: name }, (err, userdata) => {

        if (err) throw err

        if (isEmptyObject(userdata)) {
            return fn(new Error('cannot find user'));
        } else {
            var user = userdata[0]
            hash({ password: pass, salt: user.salt }, function(err, pass, salt, hash) {
                if (err) return fn(err);
                if (hash === user.hash) {
                    return fn(null, user)
                }
                fn(new Error('invalid password'));
            });
        }

    })

}
var userdata = []
var usersss = {}

const Schema = mongoose.Schema;
const roomdbs = new Schema({
    socketid: String,
    name: String,
    pubkey: String
});

const msgdb = new Schema({
    name: String,
    msg: String,
    hash: String,
    salt: String,
    key: String
})

var serveruser = new Schema({
    pub: String,
    priv: String
})
io.on('connection', socket => {
    // console.log('new user')

    var roomdb
    var dbroom
    socket.on('new-user', (room, user) => {
        dbroom = room
        roomdb = mongoose.model(room, roomdbs);
        // roomdb.find({ name: user }, (err, user) => {
        //     if (err) throw err
        //     if (!(isEmptyObject(user))) {
        //         roomdb.deleteOne({ name: user }, err => {
        //             if (err) throw err
        //         })
        //     }
        // })
        var newuser = new roomdb()
        socket.join(room)
        newuser.socketid = socket.id
        newuser.name = user.name,
            newuser.pubkey = user.pubkey
        newuser.save()
        usersss[socket.id] = user.name
        var temp = room + '_msg'
        var msg = mongoose.model(temp, msgdb)
        msg.find((err, data) => {
            if (err) throw err
            if (!(isEmptyObject(data))) {
                // console.log(data)
                socket.emit('take-msg', data)
            }
        })
    })
    socket.on('get-key', (room, user) => {
        roomdb = mongoose.model(room, roomdbs);
        roomdb.find((err, userdata) => {
            if (err) throw err
            var arr = []

            userdata.forEach(element => {
                if (!(element.name == user)) {
                    arr.push(element)
                }
            });
            socket.emit('take-key', arr)
        })
    })
    socket.on('send-chat-message', (room, data) => {
        socket.to(room).broadcast.emit('send', { user: usersss[socket.id], data: data })
    })

    socket.on('get-priv', async(room) => {
        var name = room + '_server'
        var server = mongoose.model(name, serveruser)
        await server.find(async(err, data) => {
            if (err) throw err
            await socket.emit('take-priv', data[0].priv)
        })
    })

    socket.on('add-msg', (room, obj, user) => {
        var colname = room + '_msg'
        var msgcoll = mongoose.model(colname, msgdb)
        var temp = new msgcoll()
        temp.name = user
        temp.msg = obj.message
        temp.key = obj.enckey
        temp.hash = obj.hash
        temp.salt = obj.salt
        temp.save()
    })

    socket.on('disconnect', async() => {
        roomdb.deleteOne({ socketid: socket.id }, (err) => {
            if (err) throw err
        })
        var flag = false
        await roomdb.find((err, userdb) => {
            if (err) throw err
            if (userdb.length === 0) {
                roomdb.collection.drop()
                flag = true
            }
        })
        if (flag) {

            rooms.deleteOne({ roomid: dbroom }, (err) => {
                if (err) throw err
            })
        }
        // deleteroom(roomdb)
        delete usersss[socket.id]
        removeByAttr(userdata, 'id', socket.id);
    })
})
app.get('/', function(req, res) {
    res.render('index', { id: 's', createroommessge: ' ' });
})
app.get('*/room/:roomID', restrict, function(req, res) {
    res.render('room', { rid: req.params.roomID });

    var crypt = new JSEncrypt({ default_key_size: 1024 });
    var pubkey = crypt.getPublicKey()
    var privkey = crypt.getPrivateKey()
    var name = req.params.roomID + '_server'
    mongoose.connection.db.listCollections({ name: name + 's' })
        .next(function(err, collinfo) {
            if (collinfo) {
                // The collection exists
            } else {
                var server = mongoose.model(name, serveruser)
                server.find((err, user) => {
                    if (err) throw err
                    if (isEmptyObject(user)) {
                        var temp = new server()
                        temp.pub = pubkey
                        temp.priv = privkey
                        temp.save()
                    }
                })
            }
        });

    var rname = req.params.roomID
    var roomdb = mongoose.model(rname, roomdbs);
    roomdb.find({ name: 'server' }, (err, user) => {
        if (err) throw err
        if (isEmptyObject(user)) {
            var newuser = new roomdb()
            newuser.socketid = ''
            newuser.name = 'server'
            newuser.pubkey = pubkey
            newuser.save()
        }
    })

});

app.post('*/login', function(req, res) {
    authenticate(req.body.username, req.body.password, function(err, user) {
        if (user) {
            req.session.regenerate(function() {
                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.roomid +
                    ' click to <a href="/logout">logout</a>. ' +
                    ' You may now access <a href="/restricted">/restricted</a>.';
                var urln = 'room/' + req.body.username
                res.redirect(urln);
            });
        } else {

            req.session.error = 'Authentication failed, please check your ' +
                ' username and password.' +
                ' (use "tj" and "foobar")';
            s = 'Invalid Room ID or Password'
            res.render('index', { id: 'f', createroommessge: s })
        }
    });
});
app.get('/logout', function(req, res) {
    req.session.destroy(function() {
        res.redirect('/');
    });
});

app.post('*/newroom', function(req, res) {
    var id = req.body.room
    var pass = req.body.pswd
    if (id === 'room') {
        res.render('index', { id: 'f', createroommessge: 'cannot create room with this name. try something else' })
    } else {
        rooms.find({ roomid: id }, async(err, user) => {
            if (err) throw err
            if (isEmptyObject(user)) {

                hash({ password: pass }, function(err, passwd, salt, hash) {
                    if (err) throw err;
                    // store the salt & hash in the "db"
                    var newroom = new rooms()
                    newroom.roomid = id
                    newroom.salt = salt;
                    newroom.hash = hash;
                    newroom.save()
                });

                s = 'Room created, please login with correct Room ID and Password'
                res.render('index', { id: 's', createroommessge: s })

            } else {
                s = 'Room already exist, please login or try another combination for Room ID'
                res.render('index', { id: 'f', createroommessge: s })
            }
        })
    }
})

http
