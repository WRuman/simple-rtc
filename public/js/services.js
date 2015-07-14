angular.module('simpleRTC').factory('socket_svc', 
                                    ['$rootScope', '$location',
                                    function($rootScope, $location){
    var svc = {};
    var hostname = $location.host();
    svc.sio = io.connect(hostname);
    
    svc.on = function(eventName, cb){
        svc.sio.on(eventName, function(){
           var args = arguments; // Remember that arguments is a special object
           $rootScope.$apply(function(){
               cb.apply(svc.sio, args);
           });
        });
    };
    
    svc.emit = function (eventName, data, cb) {
        svc.sio.emit(eventName, data, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                if (cb) {
                    cb.apply(svc.sio, args);
                }
            });
        });
    };
    
    svc.getSocket = function () {
          return svc.sio;
    };
                                             
    return svc;
}]);