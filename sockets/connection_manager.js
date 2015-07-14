var io = require('socket.io');

var users = {};
var userSockets = {};

module.exports = {
    initialize : function(server) {
        io = require('socket.io')(server);
    
        io.on('connection', function(socket) {
            socket.emit('users:list', users);
            
            socket.on('messages:send', function(data) {
                if(data.to && data.text && userSockets[data.to]) {
                    var now = Date.now();
                    userSockets[data.to].emit('messages:incoming', {'from' : socket.id, 'text' : data.text, 'time_sent' : now});
                }
            });
            
            socket.on('users:enroll', function(data) {
               if(data.name && data.name.length > 0 && (!users[socket.id])) {
                   var newUser = {
                       'name' : data.name,
                       'signup_time' : Date.now(),
                   };
                   users[socket.id] = newUser;
                   userSockets[socket.id] = socket;
                   socket.broadcast.emit('users:add', {'id' : socket.id, 'user' : newUser});
               } 
            });
            
            socket.on('disconnect', function(data) {
                delete users[socket.id];
                io.sockets.emit('users:delete', {'id' : socket.id}); 
            });
        });
    }  
};