var PORT = process.env.PORT || 8080;
var HOST = process.env.IP || "localhost";

var express = require("express");
var bodyParser = require("body-parser");
var socketManager = require('./sockets/connection_manager');

var app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

var server = app.listen(PORT, function() {
    console.info("simpleRTC listening at http://" + HOST + ':' + PORT);
    socketManager.initialize(server);
});
