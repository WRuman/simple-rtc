var simpleRTC = angular.module('simpleRTC', []);

simpleRTC.controller('chat_channel_ctrl', 
    ['$scope', '$rootScope', 'socket_svc',
    function($scope, $rootScope, socket_svc){
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
        
        $scope.signout = function() {
            socket_svc.emit('users:delete', {'name' : $scope.username});
            $scope.username = '';
            $scope.showForm = true;
        };
        
        $scope.sendMessage = function(userID) {
            var username = $scope.users[userID].name;
            var message = window.prompt("Message to " + username, "Hey!");
            if(message) {
                socket_svc.emit('messages:send', {'to' : userID, 'text' : message});
            }
        };
        
        $scope.startVideoChat = function(userID) {
            $rootScope.$emit('video_call:start', {'targetID' : userID});  
        };
        
        socket_svc.on('messages:incoming', function(msg) {
            if($scope.users[msg.from]) {
                msg.from = $scope.users[msg.from].name;
            }
            $scope.messages.push(msg); 
        });
        
        $scope.dstring = function(epoch) {
            var d = new Date(epoch);
            return d.toLocaleTimeString() + " on " + d.toLocaleDateString();
        };

        $scope.$on('destroy', function(event) {
            var socket = socket_svc.getSocket();
            socket.removeAllListeners('connect');
            socket.removeAllListeners('users:list');
            socket.removeAllListeners('users:add');
            socket.removeAllListeners('users:delete');
            socket.removeAllListeners('messages:incoming');
            socket.removeAllListeners('disconnect');
        });
}]);

simpleRTC.controller('video_feed_ctrl', 
['$scope', '$rootScope', 'rtc_peer_pipeline',
function($scope, $rootScope, rtc_peer_pipeline){
    var localStream;
    var remoteVideo = document.getElementById('remote-video');
    remoteVideo.autoplay = true;
    rtc_peer_pipeline.setRemoteVideoElement(remoteVideo);
    
    window.getUserMedia({'audio' : true, 'video' : true},
        function(stream) {
            localStream = stream;
            var vidElement = document.getElementById('my-video');
            vidElement.autoplay = true;
            vidElement.muted = true;
            window.attachMediaStream(vidElement, stream);
            rtc_peer_pipeline.setLocalStream(localStream);
        },
        function(error) {
            console.error(error);
        }
    );
    
    $rootScope.$on('video_call:start', function(event, params) {
        console.log("Signal target: ");
        console.log(params);
        if(params.targetID) {
            rtc_peer_pipeline.makeOfferToUserId(params.targetID);   
        }
    });
}]);
