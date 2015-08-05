var simpleRTC = angular.module('simpleRTC', []);

simpleRTC.controller('user_mgmt_ctrl',
    ['$scope', '$rootScope', 'socket_svc',
    function($scope, $rootScope, socket_svc){
        $scope.users = {};
        $scope.showForm = true;
        $scope.username = "";
        $scope.selected_user = {};
        
        socket_svc.on('connect', function(event) {
            $scope.channelStatus = "Connected to Server";
        });
        
        socket_svc.on('disconnect', function(event) {
           $scope.channelStatus = "Disconnected from Server"; 
        });
        
        socket_svc.on('users:list', function(list) {
            var ids = Object.keys(list);
            for(var i = 0; i < ids.length; ++i) {
                list[ids[i]].id = ids[i];
            }
            $scope.users = list;
        });
        
        socket_svc.on('users:add', function(userParts) {
            userParts.user.id = userParts.id;
            $scope.users[userParts.id] = userParts.user;
        });
        
        socket_svc.on('users:delete', function(target) {
            delete $scope.users[target.id];
        });
        
        $scope.user_select = function(id) {
            $scope.selected_user = $scope.users[id];
            $rootScope.$emit('user_select', id);
        };
        
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
        
        $scope.startVideoChat = function(userID) {
            $rootScope.$emit('video_call:start', {'targetID' : userID});  
        };
        
        $scope.$on('destroy', function(event) {
            var socket = socket_svc.getSocket();
            socket.removeAllListeners('connect');
            socket.removeAllListeners('users:list');
            socket.removeAllListeners('users:add');
            socket.removeAllListeners('users:delete');
            socket.removeAllListeners('disconnect');
        });
    }]);

simpleRTC.controller('chat_channel_ctrl', 
    ['$scope', '$rootScope', 'socket_svc',
    function($scope, $rootScope, socket_svc){
        $scope.selected_user = "";
        $scope.messages = {};
        $scope.msg_line = "";
        
        $scope.sendMessage = function() {
            if($scope.msg_line.length > 0) {
                console.info("Sending " + $scope.msg_line + " to " + $scope.selected_user);
                socket_svc.emit('messages:send', {'to' : $scope.selected_user, 'text' : $scope.msg_line});
                if(!$scope.messages[$scope.selected_user]){
                    $scope.messages[$scope.selected_user] = [];
                }
                $scope.messages[$scope.selected_user].push({'text' : $scope.msg_line, 'time_sent' : Date.now()});
                $scope.msg_line = "";
                
            }
        };
        

        socket_svc.on('messages:incoming', function(msg) {
            if(!$scope.messages[msg.from]) {
                $scope.messages[msg.from] = [];
            }
            $scope.messages[msg.from].push(msg); 
        });
        
        $scope.dstring = function(epoch) {
            var d = new Date(epoch);
            return d.toLocaleTimeString() + " on " + d.toLocaleDateString();
        };
        
        $rootScope.$on('user_select', function(event, userID) {
           console.info(arguments);
           $scope.selected_user = userID; 
        });

        $scope.$on('destroy', function(event) {
            var socket = socket_svc.getSocket();
            socket.removeAllListeners('messages:incoming');
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
