const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const room = new Schema({
    roomid : String,
    hash : String,
    salt : String
});

const newroom = mongoose.model('rooms', room);

//exports
module.exports = newroom