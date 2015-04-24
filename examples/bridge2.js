var static = require('node-static-alias');
var http = require('http');
var webrtc = require('..');
var ws = require('ws');
var pan = require('./pan.logger.js');
var logger = new pan.Logger();

var args = require('minimist')(process.argv.slice(2));
var MAX_REQUEST_LENGHT = 1024;
var pc = null;
var offer = null;
var answer = null;
var remoteReceived = false;

var pendingCandidates = [];

var host = args.h || '127.0.0.1';
var port = args.p || 8080;
var socketPort = args.ws || 9001;

var file = new static.Server('./examples', {
    alias: {
        match: '/dist/wrtc.js',
        serve: '../dist/wrtc.js',
        allowOutside: true
    }
});

var app = http.createServer(function (req, res) {
    logger.log(req.url);
    req.addListener('end', function () {
        file.serve(req, res);
    }).resume();

}).listen(port, host);
logger.log('Server running at http://' + host + ':' + port + '/');

var wss = new ws.Server({'port': socketPort});
wss.on('connection', function (ws) {
    logger.info('ws connected');
    function doComplete() {
        logger.info('complete');
    }

    function doHandleError(error) {
        logger.error('ERROR:', error);
    }

    function doCreateAnswer() {
        logger.info('doCreateAnswer');
        remoteReceived = true;
        pendingCandidates.forEach(function (candidate) {
            if (candidate.sdp) {
                pc.addIceCandidate(new webrtc.RTCIceCandidate(candidate.sdp));
            }
        });
        pc.createAnswer(
            doSetLocalDesc,
            doHandleError
        );
    }

    function doSetLocalDesc(desc) {
        logger.info('doSetLocalDesc');
        answer = desc;
        logger.info(desc);
        pc.setLocalDescription(
            desc,
            doSendAnswer,
            doHandleError
        );
    }

    function doSendAnswer() {
        logger.info('doSendAnswer');
        ws.send(JSON.stringify(answer));
        //logger.log('awaiting data channels');
    }

    function doSetRemoteDesc() {
        logger.info('got offer, call setRemoteDescription');
        pc.setRemoteDescription(
            offer,
            doCreateAnswer,
            doHandleError
        );
    }

    function gotRemoteStream(event) {
        logger.log("gotRemoteStream: Received remote stream");
        //remoteVideo.src = URL.createObjectURL(event.stream);
    }

    function createPeerConnection() {
        logger.log("createPeerConnection: Creating peer connection");

        pc = new webrtc.RTCPeerConnection(
            {
                iceServers: [{url: 'stun:stun.l.google.com:19302'}]
            },
            {
                'optional': [{DtlsSrtpKeyAgreement: false}]
            }
        );
        pc.onsignalingstatechange = function (state) {
            logger.info('signaling state change:', state);
        };
        pc.oniceconnectionstatechange = function (state) {
            logger.info('ice connection state change:', state);
        };
        pc.onicegatheringstatechange = function (state) {
            logger.info('ice gathering state change:', state);
        };
        pc.onicecandidate = function (candidate) {
            ws.send(JSON.stringify(
                    {
                        'type': 'ice',
                        'sdp': {
                            'candidate': candidate.candidate,
                            'sdpMid': candidate.sdpMid,
                            'sdpMLineIndex': candidate.sdpMLineIndex
                        }
                    })
            );
        };
        pc.onaddstream = gotRemoteStream;

        logger.log("createPeerConnection: Created peer connection");
        //pc.addStream(localStream);
        //logger.log("createPeerConnection: done, start offer...");

    }

    ws.on('message', function (data) {
        logger.info('Received:', data);
        data = JSON.parse(data);
        if ('offer' == data.type) {
            offer = new webrtc.RTCSessionDescription(data);
            answer = null;
            remoteReceived = false;

            createPeerConnection();

            doSetRemoteDesc();
        } else if ('ice' == data.type) {
            if (remoteReceived) {
                if (data.sdp.candidate) {
                    pc.addIceCandidate(new webrtc.RTCIceCandidate(data.sdp.candidate));
                }
            } else {
                pendingCandidates.push(data);
            }
        }
    });
});
