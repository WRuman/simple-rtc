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
        var localStreamAdded = false;
        var remoteVideoElement;
        var pc;
        
        pipe.setLocalStream = function(lstream) {
            localStream = lstream;
        };
        
        pipe.setRemoteVideoElement = function(relement) {
            remoteVideoElement = relement;
        };
        
        function popError(content) {
            console.error('Error:');
            console.error(content);
        }
        
        
        pipe.makeOfferToUserId = function(userID) {
            caller = true;
            targetID = userID;
            if(!pc) {
                createPeerConnection();
            }
            if(localStream) {
                pc.addStream(localStream);   
            }

            pc.createOffer(setLocalAndOffer, popError, {
                // SDP options
                'offerToReceiveAudio' : true,
                'offerToReceiveVideo' : true
            });
        };
        
        function setLocalAndOffer(offerSDP) {
            pc.setLocalDescription(offerSDP, function(){
                console.info("Sending offer to " + targetID);
                socket_svc.emit('rtc:signal', {
                    'to' : targetID,
                    'type' : 'offer',
                    'offer' : offerSDP
                });
            }, function(error) {
                if(error) {
                    console.error("Error setting local description on offer:");
                    console.error(error);
                }
            });
        }
        
        function setLocalAndAnswer() {
            pc.createAnswer(function(answerSDP) {
                pc.setLocalDescription(answerSDP, function(){
                    console.info("Sending answer to " + targetID);
                    socket_svc.emit('rtc:signal', {
                        'to' : targetID,
                        'type' : 'answer',
                        'answer' : answerSDP
                    });
                }, function(error) {
                    console.error("Error setting local description on answer:");
                    console.error(error);
                });
            });
        }
        
        function setRemoteDescription(description) {
            var remoteDescription = new window.RTCSessionDescription(description);
            pc.setRemoteDescription(remoteDescription);
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
            console.info("Created new peer connection:");
            console.info(pc);
            pc.onicecandidate = function(event) {
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
        

        socket_svc.on('rtc:signal', function(message) {
            switch (message.type) {
                case 'offer' :
                    targetID = message.from;
                    if(!pc) {
                        createPeerConnection();
                    }
                    if(!localStreamAdded && localStream) {
                        pc.addStream(localStream);
                        localStreamAdded = true;
                    }
                    setRemoteDescription(message.offer);
                    setLocalAndAnswer();
                    break;
                case 'answer' :
                    console.info("Answer received");
                    console.info(message);
                    setRemoteDescription(message.answer);
                    break;
                case 'candidate' :
                    var newCandidate = new window.RTCIceCandidate({
                        'sdpMLineIndex' : message.label,
                        'sdpMid' : message.id,
                        'candidate' : message.candidate
                    });
                    pc.addIceCandidate(newCandidate);
                    break;
            }
        });
        
        return pipe;
    }]);