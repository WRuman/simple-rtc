var simpleRTC = angular.module('simpleRTC', []);

simpleRTC.controller('signal_channel_ctrl', 
    ['$scope', 'socket_svc',
    function($scope, socket_svc){
        $scope.channelStatus = "Not connected";
        
        socket_svc.on('connection', function(event) {
            $scope.channelStatus = "Connected";
        });

        $scope.$on('destroy', function(event) {
            var socket = socket_svc.getSocket();
            socket.removeAllListeners('connect');
        });
}]);
