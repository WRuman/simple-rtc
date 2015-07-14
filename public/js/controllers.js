var simpleRTC = angular.module('simpleRTC', []);

simpleRTC.controller('chat_channel_ctrl', 
    ['$scope', 'socket_svc',
    function($scope, socket_svc){
        $scope.channelStatus = "Not connected";
        $scope.users = {};
        $scope.username = '';
        $scope.showForm = true;
        $scope.messages = [];
        
        socket_svc.on('connect', function(event) {
            $scope.channelStatus = "Connected";
        });
        
        socket_svc.on('disconnect', function(event) {
           $scope.channelStatus = "Not connected"; 
        });
        
        socket_svc.on('users:list', function(list) {
            $scope.users = list;
        });
        
        socket_svc.on('users:add', function(userParts) {
            $scope.users[userParts.id] = userParts.user;
        });
        
        socket_svc.on('users:delete', function(target) {
            delete $scope.users[target.id];
        });
        
        $scope.signup = function() {
            if($scope.username.length > 0) {
                socket_svc.emit('users:enroll', {'name' : $scope.username});
                $scope.showForm = false;
            }
        };
        
        $scope.sendMessage = function(userID) {
            var username = $scope.users[userID].name;
            var message = window.prompt("Message to " + username, "Hey!");
            if(message) {
                socket_svc.emit('messages:send', {'to' : userID, 'text' : message});
            }
        };
        
        socket_svc.on('messages:incoming', function(msg) {
            //msg.from = $scope.users[msg.from].name;
           $scope.messages.push(msg); 
        });
        
        $scope.dstring = function(epoch) {
            return (new Date(epoch)).toLocaleDateString();
        };

        $scope.$on('destroy', function(event) {
            var socket = socket_svc.getSocket();
            socket.removeAllListeners('connect');
            socket.removeAllListeners('users:list');
            socket.removeAllListeners('users:add');
            socket.removeAllListeners('users:delete');
        });
}]);
