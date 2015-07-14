var PORT = process.env.PORT || 8080;
var HOST = process.env.HOST || "localhost";

var express = require("express");
var bodyParser = require("body-parser");
var io;

var app = express();
app.use(express.static('public'));
app.use(bodyParser.json());



var server = app.listen(PORT, function() {
    console.info("simpleRTC listening at http://" + HOST + ':' + PORT);
    io = require('socket.io')(server);
    
    io.on('connection', function(socket) {
        console.log(socket);
    });
});
