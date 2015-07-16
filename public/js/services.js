angular.module('simpleRTC').factory('socket_svc', 
                                    ['$rootScope', '$location',
                                    function($rootScope, $location){
    var svc = {};
    var hostname = $location.host();
    svc.sio = window.io.connect(hostname);
    
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

angular.module('simpleRTC').factory('rtc_peer_pipeline',
    ['$q', 'socket_svc',
    function($q, socket_svc){
        var pipe = {};
        var started = false;
        var caller = false;
        var targetID;
        var localStream;
        var remoteVideoElement;
        var pc;
        
        pipe.setLocalStream = function(lstream) {
            localStream = lstream;
        };
        
        pipe.setRemoteVideoElement = function(relement) {
            remoteVideoElement = relement;
        };
        
        pipe.makeOfferToUserId = function(userID) {
            caller = true;
            targetID = userID;
        };
        
        function applyLocalSessionDescription(offer) {
            pc.setLocalDescription(offer, function(){
                socket_svc.emit('rtc:signal', {
                    'type' : 'offer',
                    'payload' : pc.localDescription
                });
            }, function(error) {
                if(error) {
                    console.error("Error setting local description:");
                    console.error(error);
                }
            });
        }
        
        function createPeerConnection() {
            var peerConnectionConfig = {
                'iceServers' : [
                    {
                        'url' : 'stun:stun.l.google.com:19302'
                    }    
                ]
            };
            pc = new window.RTCPeerConnection(peerConnectionConfig);
            
            pc.onIceCandidate = function(event) {
                console.info("ICE Candidate:");
                console.info(event.candidate);
                if(event.candidate) {
                    socket_svc.emit('rtc:signal', {
                        'type' : 'candidate',
                        'to' : targetID,
                        'label' : event.candidate.sdpMLineIndex,
                        'id' : event.candidate.sdpMid,
                        'candidate' : event.candidate.candidate
                    });
                } else {
                    console.info('End of candidates reached');
                }
            };
            
            if(caller) {
                pc.createOffer(applyLocalSessionDescription, function(error) {
                    if(error) {
                        console.error("Error creating offer:");
                        console.error(error);
                    }
                }, {
                    // SDP options
                    'offerToReceiveAudio' : true,
                    'offerToReceiveVideo' : true
                });
            }
            
            pc.onconnecting = function(cnct) {
                console.info("Connecting:");
                console.info(cnct);
            };
            pc.onopen = function(opn) {
                console.info('Open:');
                console.info(opn);
            };
            pc.onremovestream = function(cls) {
                console.info("Close:");
                console.info(cls);
            };
            pc.onaddstream = function(event) {
                console.info("Add Stream:");
                console.info(event.stream);
                window.attachMediaStream(remoteVideoElement, event.stream);
            };
        }
        
        function enterPipeline() {
            if(!started && localStream && remoteVideoElement) {
                createPeerConnection();
                pc.addStream(localStream);
                started = true;
            }
        }
        
        socket_svc.on('rtc:signal', function(message) {
            switch (message.type) {
                case 'offer' :
                    if(!caller && !started) {
                        enterPipeline();
                    }
                    break;
            }
        });
        
        return pipe;
    }]);